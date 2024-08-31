# GestureNav

This is a proof-of-concept browser extension for navigating the web using gestures. It uses a machine learning model to recognize gestures from the webcam.

## Prerequisites

- Python 3.8+
- [Bun](https://bun.sh)

## Developing

To run the extension with the pre-trained model, run:

```
bun install
bun dev
```

To train a gesture recognition model, either use the Jupyter notebook or run:

```
python -m venv .venv
source .venv/bin/activate
python -m pip install ipython
python -m IPython gesture_recognizer.py
```
