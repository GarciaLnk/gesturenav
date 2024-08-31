<script lang="ts">
  import Button from "$lib/components/ui/button/button.svelte";
  import {
    GestureRecognizer,
    FilesetResolver,
    DrawingUtils,
  } from "@mediapipe/tasks-vision";
  import type { GestureRecognizerResult } from "@mediapipe/tasks-vision";
  import { onMount } from "svelte";

  const videoWidth = "384px";
  const videoHeight = "216px";
  const bgMessage: { id: number | undefined; running: boolean; from: string } =
    {
      id: undefined,
      running: false,
      from: "offscreen",
    };

  let loaded = false;
  let gestureRecognizer: GestureRecognizer;
  let webcamDisabled = true;
  let webcamVideo: HTMLVideoElement;
  let outputCanvas: HTMLCanvasElement;
  let webcamRunning = false;
  let lastVideoTime = -1;
  let videoResults: GestureRecognizerResult;
  let predicting = false;
  let categoryName = "";
  let categoryScore = "";
  let handedness = "";
  let activeTabId: number | undefined;

  onMount(async () => {
    const vision = await FilesetResolver.forVisionTasks("/assets/wasm");
    gestureRecognizer = await GestureRecognizer.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath: "/gesture_recognizer.task",
        delegate: "GPU",
      },
      runningMode: "VIDEO",
    });
    loaded = true;

    bgMessage.id = await browser.windows
      .getCurrent()
      .then((window) => window.id);
    enableCam();

    window.onbeforeunload = () => {
      bgMessage.id = undefined;
      bgMessage.running = false;
      void browser.runtime.sendMessage(bgMessage);
      void sendResults(null);
    };
  });

  async function sendResults(message: GestureRecognizerResult | null) {
    await browser.tabs
      .query({ active: true, lastFocusedWindow: true, currentWindow: false })
      .then((tabs) => {
        if (tabs.length === 0) return;
        activeTabId = tabs[0].id;
      })
      .finally(() => {
        if (activeTabId) {
          browser.tabs.sendMessage(activeTabId, message).catch((e) => void e);
        }
      });
  }

  // Enable the live webcam view and start detection.
  function enableCam() {
    if (!gestureRecognizer) {
      alert("Please wait for gestureRecognizer to load");
      return;
    }
    webcamRunning = !webcamRunning;
    bgMessage.running = webcamRunning;
    void browser.runtime.sendMessage(bgMessage);

    if (!webcamRunning) {
      void new Promise(() => {
        const intervalId = setInterval(() => {
          if (!predicting) {
            clearInterval(intervalId);
            void sendResults(null);
          }
        }, 100);
      });
    } else {
      // Activate the webcam stream.
      navigator.mediaDevices
        .getUserMedia({
          video: true,
        })
        .then(function (stream) {
          webcamVideo.srcObject = stream;
          webcamVideo.addEventListener("loadeddata", predictWebcam);
        })
        .catch(function (err) {
          console.error("Error accessing the webcam", err);
        });
      webcamDisabled = false;
    }
  }

  function predictWebcam() {
    predicting = true;
    let nowInMs = Date.now();
    if (webcamVideo.currentTime !== lastVideoTime) {
      lastVideoTime = webcamVideo.currentTime;
      videoResults = gestureRecognizer.recognizeForVideo(webcamVideo, nowInMs);
      void sendResults(videoResults);
    }
    const canvasCtx = outputCanvas.getContext("2d")!;
    canvasCtx.save();
    canvasCtx.clearRect(0, 0, outputCanvas.width, outputCanvas.height);
    const drawingUtils = new DrawingUtils(canvasCtx);
    if (videoResults.landmarks) {
      for (const landmarks of videoResults.landmarks) {
        drawingUtils.drawConnectors(
          landmarks,
          GestureRecognizer.HAND_CONNECTIONS,
          {
            color: "#00FF00",
            lineWidth: 5,
          },
        );
        drawingUtils.drawLandmarks(landmarks, {
          color: "#FF0000",
          lineWidth: 2,
        });
      }
    }
    canvasCtx.restore();

    // Call this function again to keep predicting when the browser is ready.
    if (webcamRunning === true) {
      window.requestAnimationFrame(predictWebcam);
    } else {
      predicting = false;
    }
  }

  $: categoryName = videoResults?.gestures?.[0]?.[0]?.categoryName ?? "";
  $: categoryScore =
    parseFloat(
      (videoResults?.gestures?.[0]?.[0]?.score * 100).toString(),
    ).toFixed(2) ?? "";
  $: handedness = videoResults?.handedness?.[0]?.[0]?.displayName ?? "";
</script>

<main
  class="flex min-h-screen flex-col items-center gap-2 overflow-hidden bg-background py-4 text-foreground"
  class:opacity-20={!loaded}
>
  <Button class="w-64" disabled={webcamDisabled} on:click={enableCam}>
    {#if webcamRunning}
      STOP
    {:else if webcamDisabled}
      LOADING...
    {:else}
      START
    {/if}
  </Button>
  <div class="relative">
    <video
      bind:this={webcamVideo}
      style="width: {videoWidth}; height: {videoHeight};"
      class="left-0 top-0 scale-x-[-1] transform-gpu"
      autoplay
      muted
      playsinline
    />
    <canvas
      bind:this={outputCanvas}
      style="width: {videoWidth}; height: {videoHeight};"
      class="absolute left-0 top-0 scale-x-[-1] transform-gpu"
      height="1080"
      width="1920"
    />
  </div>
  <p>
    {#if videoResults?.gestures?.length > 0}
      Gesture: {categoryName}<br />
      Confidence: {categoryScore} %<br />
      Hand: {handedness}<br />
    {/if}
  </p>
</main>
