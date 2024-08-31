<script lang="ts">
  import dislikeImg from "~/assets/gestures/dislike.jpeg";
  import likeImg from "~/assets/gestures/like.jpeg";
  import dragImg from "~/assets/gestures/drag.jpg";
  import pointImg from "~/assets/gestures/point.jpg";
  import loupeImg from "~/assets/gestures/loupe.jpg";
  import Button from "$lib/components/ui/button/button.svelte";

  async function handleClick() {
    await browser.runtime.sendMessage({ from: "welcome" });
  }
</script>

<main
  class="flex min-h-screen justify-center bg-background p-8 text-foreground"
>
  <div class="flex max-w-4xl flex-col items-center justify-center">
    <h1 class="mb-6 text-center text-3xl font-bold">Welcome to GestureNav</h1>
    <p class="mb-8 text-justify text-lg text-muted-foreground">
      Control your cursor and navigate websites with hand gestures! Click the
      toolbar icon or the button below to enable the extension and see the
      cursor appear on the website. In "pull" mode, the cursor moves based on
      your hand's position relative to the screen's center. You can reset the
      center point with an "ok" gesture. Switch to "pointer" mode with a "two"
      gesture to control the cursor directly with your hand. Use a "one" gesture
      to click, a "like" gesture to go forward in history, and a "dislike"
      gesture to go back.
    </p>

    <div class="mb-8 grid grid-cols-1 gap-8 sm:grid-cols-2 md:grid-cols-3">
      <div class="flex flex-col items-center">
        <img
          class="mb-2 h-48 w-48 rounded-lg object-contain"
          alt="One Gesture"
          src={pointImg}
        />
        <p class="text-center text-muted-foreground">One Gesture: Click</p>
      </div>

      <div class="flex flex-col items-center">
        <img
          class="mb-2 h-48 w-48 rounded-lg object-contain"
          alt="Two Gesture"
          src={dragImg}
        />
        <p class="text-center text-muted-foreground">
          Two Gesture: Switch to Pointer Mode
        </p>
      </div>

      <div class="flex flex-col items-center">
        <img
          class="mb-2 h-48 w-48 rounded-lg object-contain"
          alt="OK Gesture"
          src={loupeImg}
        />
        <p class="text-center text-muted-foreground">
          OK Gesture: Recalibrate Center
        </p>
      </div>

      <div class="flex flex-col items-center">
        <img
          class="mb-2 h-48 w-48 rounded-lg object-contain"
          alt="Like Gesture"
          src={likeImg}
        />
        <p class="text-center text-muted-foreground">
          Like Gesture: Go Forward in History
        </p>
      </div>

      <div class="flex flex-col items-center">
        <img
          class="mb-2 h-48 w-48 rounded-lg object-contain"
          alt="Dislike Gesture"
          src={dislikeImg}
        />
        <p class="text-center text-muted-foreground">
          Dislike Gesture: Go Back in History
        </p>
      </div>
    </div>

    <Button class="w-64" on:click={handleClick}>ENABLE WEBCAM</Button>
  </div>
</main>
