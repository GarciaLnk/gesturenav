#!/usr/bin/env python
# coding: utf-8

# # Hand gesture recognition model
#

# In[ ]:


"""
This script trains a hand gesture recognition model using MediaPipe Model Maker.
The model is trained on a dataset of hand gesture images.
The script loads the dataset, trains the model, evaluates the model performance,
and exports the model to a TensorFlow Lite model.
"""


# ### Prerequisites
#

# Install the MediaPipe Model Maker package and TensorFlow.
#

# In[ ]:


get_ipython().run_line_magic("pip", "install --upgrade pip")
get_ipython().run_line_magic(
    "pip", "install mediapipe-model-maker tensorflow[and-cuda]"
)


# Import the required libraries.
#

# In[ ]:


import os
import urllib.request
import zipfile

import tensorflow as tf

assert tf.__version__.startswith("2")

from mediapipe_model_maker import gesture_recognizer


# ### Get the dataset
#

# In[ ]:


url = "https://archive.org/download/hand_gestures_dataset/hand_gesture_recognition_dataset.zip"
filename = "hand_gesture_recognition_dataset.zip"
urllib.request.urlretrieve(url, filename)

with zipfile.ZipFile(filename, "r") as zip_ref:
    zip_ref.extractall()

os.remove(filename)


# Verify the dataset by printing the labels.
# There should be 6 gesture labels, with one of them being the `none` gesture.
#

# In[ ]:


dataset_path = "dataset"
labels = []
for i in os.listdir(dataset_path):
    if os.path.isdir(os.path.join(dataset_path, i)):
        labels.append(i)
print(labels)


# ### Load the dataset
#

# In[ ]:


data = gesture_recognizer.Dataset.from_folder(
    dirname=dataset_path,
    hparams=gesture_recognizer.HandDataPreprocessingParams(),
)
train_data, rest_data = data.split(0.8)
validation_data, test_data = rest_data.split(0.5)


# ### Train the model
#

# In[ ]:


hparams = gesture_recognizer.HParams(
    batch_size=16, lr_decay=1, epochs=20, export_dir="exported_model"
)
model_options = gesture_recognizer.ModelOptions(dropout_rate=0.1)
options = gesture_recognizer.GestureRecognizerOptions(
    model_options=model_options, hparams=hparams
)
model = gesture_recognizer.GestureRecognizer.create(
    train_data=train_data, validation_data=validation_data, options=options
)


# ### Evaluate the model performance
#

# In[ ]:


loss, acc = model.evaluate(test_data, batch_size=1)
print(f"Test loss:{loss}, Test accuracy:{acc}")


# ### Export to Tensorflow Lite Model
#

# In[ ]:


model.export_model()
print(os.listdir("exported_model"))
