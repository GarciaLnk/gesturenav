import type { GestureRecognizerResult } from "@mediapipe/tasks-vision";
import { storage } from "wxt/storage";

interface CursorProps {
  x: number;
  y: number;
  size: number;
  color: string;
  hand: string;
  mode: string;
  centerX: number;
  centerY: number;
}

export default defineContentScript({
  matches: ["<all_urls>"],
  runAt: "document_end",

  main() {
    let videoResults: GestureRecognizerResult;
    let recognizerRunnning = false;

    const cursor = document.createElement("div");
    let cursorProps = {
      x: window.innerWidth / 2,
      y: window.innerWidth / 2,
      size: 24,
      color: "blue",
      hand: "right",
      mode: "pull",
      centerX: window.innerWidth / 2,
      centerY: window.innerHeight / 2,
    };

    cursor.style.position = "fixed";
    cursor.style.top = cursorProps.x + "px";
    cursor.style.left = cursorProps.y + "px";
    cursor.style.zIndex = "2147483647";
    cursor.style.pointerEvents = "none";
    cursor.style.display = "none";

    document.body.appendChild(cursor);

    void storage.getItem<CursorProps>("local:cursor").then((newCursor) => {
      newCursor && setCursor(newCursor);
    });

    void storage.watch<CursorProps>("local:cursor", (newCursor) => {
      newCursor && setCursor(newCursor);
    });

    function setCursor(newCursor: CursorProps) {
      cursorProps = newCursor ?? cursorProps;
      cursor.style.left = cursorProps.x + "px";
      cursor.style.top = cursorProps.y + "px";
      updateCursorSVG();
    }

    void browser.runtime.onMessage.addListener(
      (message: GestureRecognizerResult | null) => {
        if (message) {
          videoResults = message;
          if (!recognizerRunnning) {
            recognizerRunnning = true;
            cursor.style.display = "block";
            update();
          }
        } else if (recognizerRunnning) {
          recognizerRunnning = false;
          cursor.style.display = "none";
        }
      },
    );

    function updateCursorSVG() {
      cursor.innerHTML = `
      <svg width="${cursorProps.size}" height="${cursorProps.size}" viewBox="0 0 24 24" fill="${cursorProps.color}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <filter id="dropshadow" height="130%" width="130%">
            <feGaussianBlur in="SourceAlpha" stdDeviation="1.1"/>
            <feOffset dx="1" dy="1" result="offsetblur"/>
            <feComponentTransfer>
              <feFuncA type="linear" slope="0.1"/>
            </feComponentTransfer>
            <feMerge>
              <feMergeNode/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>
        <g style="filter:url(#dropshadow);"${
          cursorProps.hand === "left"
            ? `transform="translate(${cursorProps.size}, 0) scale(-1, 1)"`
            : ``
        }>
            <path d="M17.2607 12.4008C19.3774 11.2626 20.4357 10.6935 20.7035 10.0084C20.9359 9.41393 20.8705 8.74423 20.5276 8.20587C20.1324 7.58551 18.984 7.23176 16.6872 6.52425L8.00612 3.85014C6.06819 3.25318 5.09923 2.95471 4.45846 3.19669C3.90068 3.40733 3.46597 3.85584 3.27285 4.41993C3.051 5.06794 3.3796 6.02711 4.03681 7.94545L6.94793 16.4429C7.75632 18.8025 8.16052 19.9824 8.80519 20.3574C9.36428 20.6826 10.0461 20.7174 10.6354 20.4507C11.3149 20.1432 11.837 19.0106 12.8813 16.7454L13.6528 15.0719C13.819 14.7113 13.9021 14.531 14.0159 14.3736C14.1168 14.2338 14.2354 14.1078 14.3686 13.9984C14.5188 13.8752 14.6936 13.7812 15.0433 13.5932L17.2607 12.4008Z" stroke="#F0F0F0" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path>
        </g>
      </svg>`;
    }

    function updatePosition() {
      if (videoResults) {
        let handX: number;
        let handY: number;
        if (videoResults.landmarks?.[0]?.[5]) {
          cursorProps.hand =
            videoResults.handedness[0][0].categoryName.toLowerCase();
          const sensitivity = 0.025;
          const deadzone = 25;

          handX = window.innerWidth * videoResults.landmarks[0][5].x;
          handY = window.innerHeight * videoResults.landmarks[0][5].y;

          const distanceX = cursorProps.centerX - handX;
          const distanceY = handY - cursorProps.centerY;

          if (
            Math.abs(distanceX) > deadzone ||
            Math.abs(distanceY) > deadzone
          ) {
            cursorProps.x += distanceX * sensitivity;
            cursorProps.y += distanceY * sensitivity;

            if (cursorProps.x < 0 || cursorProps.x > window.innerWidth - 20) {
              window.scrollBy(distanceX * sensitivity, 0);
            }

            if (cursorProps.y < 0 || cursorProps.y > window.innerHeight - 20) {
              window.scrollBy(0, distanceY * sensitivity);
            }

            cursorProps.x = Math.max(
              0,
              Math.min(window.innerWidth - 20, cursorProps.x),
            );
            cursorProps.y = Math.max(
              0,
              Math.min(window.innerHeight - 10, cursorProps.y),
            );
          }

          if (cursorProps.mode === "pointer") {
            cursorProps.x =
              window.innerWidth -
              window.innerWidth * videoResults.landmarks[0][8].x;
            cursorProps.y = window.innerHeight * videoResults.landmarks[0][8].y;
          }

          cursor.style.left = cursorProps.x + "px";
          cursor.style.top = cursorProps.y + "px";

          void storage.setItem("local:cursor", cursorProps);
        }

        if (videoResults.gestures) {
          videoResults.gestures.forEach((gesture) => {
            switch (gesture[0].categoryName.toLowerCase()) {
              case "point":
                cursorProps.color = "green";
                debounce(() => {
                  document
                    .elementFromPoint(cursorProps.x, cursorProps.y)
                    ?.dispatchEvent(
                      new MouseEvent("click", {
                        bubbles: true,
                        cancelable: true,
                        clientX: cursorProps.x,
                        clientY: cursorProps.y,
                      }),
                    );
                }, 10)();
                break;
              case "loupe":
                cursorProps.color = "red";
                debounce(() => {
                  cursorProps.centerX = handX;
                  cursorProps.centerY = handY;
                  cursorProps.mode = "pull";
                }, 10)();
                break;
              case "like":
                if (gesture[0].score < 0.9) break;
                cursorProps.color = "white";
                debounce(() => {
                  window.history.forward();
                }, 1000)();
                break;
              case "dislike":
                if (gesture[0].score < 0.9) break;
                cursorProps.color = "black";
                debounce(() => {
                  window.history.back();
                }, 1000)();
                break;
              case "drag":
                cursorProps.color = "orange";
                debounce(() => {
                  cursorProps.mode = "pointer";
                }, 200)();
                break;
              default:
                cursorProps.color = "blue";
                debounce(() => {
                  if (cursorProps.mode === "pointer") {
                    cursorProps.centerX = handX;
                    cursorProps.centerY = handY;
                    cursorProps.mode = "pull";
                  }
                }, 200)();
                break;
            }
          });
        }
      }
    }

    function debounce(func: () => void, wait: number) {
      let timeout: NodeJS.Timeout | null;
      return () => {
        const later = () => {
          if (timeout) {
            clearTimeout(timeout);
            timeout = null;
          }
          func();
        };
        if (timeout) {
          clearTimeout(timeout);
        }
        timeout = setTimeout(later, wait);
      };
    }

    function update() {
      updatePosition();
      updateCursorSVG();
      if (recognizerRunnning) {
        window.requestAnimationFrame(update);
      }
    }
  },
});
