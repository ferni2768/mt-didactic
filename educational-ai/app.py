import sys
from itertools import zip_longest

import numpy as np
import pandas
from keras.utils import pad_sequences
from keras_preprocessing.text import Tokenizer
from matplotlib import pyplot as plt
from sklearn.model_selection import train_test_split

from sklearn.metrics import confusion_matrix # aqui

import usecase
import os

import tensorflow as tf
import tokenizer_utils as ts_utils
import dataset_utils as ds_utils
from flask import Flask, request, make_response, current_app, jsonify
from flask_cors import CORS
from usecase import model_histories

# Start a Flask App to serve an API.
app = Flask(__name__)
# Define stacked progress to plot machine teaching progression over different iterations.
machine_teaching_progress = []
app.config['JSONIFY_MIMETYPE'] = 'application/json'
CORS(app)

np.set_printoptions(threshold=sys.maxsize)
plt.style.use('ggplot')
tokenizer = Tokenizer(char_level=True, lower=True)
# Load unordered dataSets for fine-tuning.
dipt = ds_utils.load_dataset("./database/diptongos.csv", 0, 1, 3)
hiat = ds_utils.load_dataset("./database/hiatos.csv", 0, 1, 3)
none = ds_utils.load_dataset("./database/general.csv", 0, 1, 2)

# Add fake word cases.
# dipt = ds_utils.generate_fake_words(dipt)
# hiat = ds_utils.generate_fake_words(hiat)
# none = ds_utils.generate_fake_words(none)

# Shuffle words.
mixed = pandas.concat([dipt, hiat, none]).sort_values(by="DIFICULTAD")

# Split in data and target.
x, y = ds_utils.split_data(mixed, 2)

# Save words without tokenization for guided machine-teaching.
x0_unencoded = x[:, 0][:386]
x1_unencoded = x[:, 0][386:596]

# Set max length as padding.
padding = len(max(x[:, 0], key=len))

# Encoding of target.
y = tf.keras.utils.to_categorical(y, num_classes=3)

# Remove all 'h' chars from data to reduce complexity. DOES NOT IMPROVE ACCURACY.
simplified_x = np.asarray([s.replace('h', '') for s in x[:, 0]])
# Encoding of data.
tokenizer.fit_on_texts(x[:, 0])
tokenizer.word_index = ts_utils.customize_word_index(tokenizer.word_index)
x = tokenizer.texts_to_sequences(x[:, 0])
x = pad_sequences(x, maxlen=padding)
x0 = x[:386]
x1 = x[386:596]
x2 = x[596:]

y0 = y[:386, :]
y1 = y[386:596, :]
y2 = y[596:, :]

# Split in train/test sets.
# aqui, cambié el test_size (era 0.10 antes)
x_train0, x_test0, y_train0, y_test0 = train_test_split(np.array(list(zip_longest(*x0, fillvalue=0))).T,
                                                        y0, test_size=0.10)
x_train1, x_test1, y_train1, y_test1 = train_test_split(np.array(list(zip_longest(*x1, fillvalue=0))).T,
                                                        y1, test_size=0.10)
x_train2, x_test2, y_train2, y_test2 = train_test_split(np.array(list(zip_longest(*x2, fillvalue=0))).T,
                                                        y2, test_size=0.10)

# Same splits for automated machine teaching.

x_train0_unencoded, _, _, _ = train_test_split(x0_unencoded, y0, test_size=0.10)
x_train1_unencoded, _, _, _ = train_test_split(x1_unencoded, y1, test_size=0.10)

# Generate full train and test datasets.
x_train = np.concatenate((x_train0, x_train1, x_train2))
x_test = np.concatenate((x_test0, x_test1, x_test2))
y_train = np.concatenate((y_train0, y_train1, y_train2))
y_test = np.concatenate((y_test0, y_test1, y_test2))

# Generate progression for modified Baby-Step.
x_increment_01 = np.concatenate((x_train0, x_train1))
x_increment_01_unencoded = np.concatenate((x_train0_unencoded, x_train1_unencoded))
x_increment_012 = np.concatenate((x_train0, x_train1, x_train2))
y_increment_01 = np.concatenate((y_train0, y_train1))
y_increment_012 = np.concatenate((y_train0, y_train1, y_train2))

models_dir = os.path.join(os.getcwd(), 'models')
default_models = [
    'curriculum_max.keras',
    'curriculum_under_trained.keras',
    'max.keras',
    'under_trained.keras',
    'max_k_folds.keras',
    'curriculum_max_k_folds.keras',
    'under_trained_k_folds.keras',
    'curriculum_under_trained_k_folds.keras'
]
models_missing = [model for model in default_models if not os.path.exists(os.path.join(models_dir, model))]

if models_missing:
    usecase.reset(x, y, x_train, y_train, x_train0, y_train0, x_increment_01,
                  y_increment_01, x_increment_012, y_increment_012, models_missing)


# Root
# @app.route('/')
# def root():
#     return '¡Bienvenido a la aplicación!'


# Resets models to default with a new fresh training.
@app.route('/reset-models', methods=['POST'])
def reset_models():
    try:
        usecase.reset(x, y, x_train, y_train, x_train0, y_train0, x_increment_01, y_increment_01, x_increment_012,
                      y_increment_012)
        # Return a success message
        return jsonify({'message': 'Models have been reset and retrained successfully.'}), 200
    except Exception as e:
        # In case of an error, return an error message
        return jsonify({'error': str(e)}), 500


# Loads a new model.
@app.route('/models/<model_name>', methods=['POST'])
def load_new_model(model_name):
    curriculum = request.args.get('curriculum', default=True, type=bool)
    kfolds = request.args.get('kfolds', default=False, type=bool)
    usecase.load_new(model_name=model_name, curriculum=curriculum, kfolds=kfolds)
    return jsonify({"message": "Model loaded successfully"})

# Handles the restart of a class.
@app.route('/class/<class_code>/delete', methods=['PUT'])
def delete_class(class_code):
    usecase.handle_class_deletion(class_code)
    return jsonify({"message": "Class deleted successfully"}), 200


# Deletes a stored model.
@app.route('/models/<model_name>', methods=['DELETE'])
def delete_model(model_name):
    try:
        usecase.delete_model(model_name)
        return jsonify_no_content()
    except FileNotFoundError:
        return jsonify({'error': 'Model not found'}), 404
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# Trains the model with the given set of words.
@app.route('/models/<model_name>/train', methods=['POST'])
def train_model(model_name):
    words = request.get_json()
    progress, mistakes = usecase.teach(model_name, words, tokenizer, padding) # aqui
    machine_teaching_progress.append(progress)
    response = jsonify(mistakes.tolist()) # aqui
    return response, 200, {'Content-Type': 'application/json'}


# Uses the given model to make a prediction about the word sent.
@app.route('/models/<model_name>/predict/<word>', methods=['PUT'])
def make_prediction(model_name, word):
    result = usecase.predict(model_name, tokenizer, word)
    return jsonify(result)


# Tests the model against the fixed test dataSet.
@app.post('/models/test')
def test_models():
    model_names = request.json.get('model_names')
    if not model_names:
        return {"error": "No model names provided"}, 400
    return usecase.evaluate(model_names, x_test, y_test)


@app.route('/models/<model_name>/matrix', methods=['POST'])
def get_confusion_matrix(model_name):
    try:
        # Load the model
        model = usecase.get_pretrained_model(model_name)
        
        # Predict the classes of the test dataset
        predictions = model.predict(np.expand_dims(x_test, axis=2))
        predicted_classes = np.argmax(predictions, axis=1)
        
        # Convert the true labels to class indices
        true_classes = np.argmax(y_test, axis=1)
        
        # Calculate the confusion matrix
        cm = confusion_matrix(true_classes, predicted_classes)
        
        # Return the confusion matrix as a JSON response
        return jsonify(cm.tolist()), 200
    except Exception as e:
        # In case of an error, return an error message
        return jsonify({'error': str(e)}), 500

# Retrieves the models list
@app.get('/models')
def get_model_names():
    models_folder = os.path.join(os.getcwd(), 'models')
    filenames = [os.path.splitext(file)[0] for file in os.listdir(models_folder)]
    print(filenames)
    return jsonify(filenames)


# Retrieves the selected model history.
@app.route('/models/<model_name>/history', methods=['GET'])
def get_history(model_name, extension='.keras'):
    if not model_name.endswith(extension):
        model_name += extension
    if model_name in model_histories:
        return jsonify(model_histories[model_name]), 200
    else:
        return jsonify({"error": "Model not found"}), 404


# Makes an application/json response for 204 in Flask.
def jsonify_no_content():
    response = make_response('', 204)
    response.mimetype = current_app.config['JSONIFY_MIMETYPE']
    return response


# Start listening to the served endpoints.
if __name__ == '__main__':
    app.run()