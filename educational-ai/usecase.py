import os

import keras.models
from sklearn.model_selection import StratifiedKFold
from keras import Sequential
from keras.layers import LSTM, BatchNormalization, Dropout, Dense, Flatten, Conv1D, MaxPooling1D

import machine_teaching
import numpy as np
import tensorflow as tf
import graph_utils

from keras_tuner import BayesianOptimization
from keras.utils import pad_sequences
from keras.regularizers import l1_l2


model_histories = {}


def sequential_model(x_train, x_test, y_train, y_test):
    model = tf.keras.models.Sequential()
    model.add(tf.keras.layers.Dense(128))
    model.add(tf.keras.layers.Dense(128))
    # model.add(BatchNormalization())
    model.add(tf.keras.layers.Dense(128))
    model.add(tf.keras.layers.Dense(128))
    # model.add(BatchNormalization())
    # model.add(Dropout(0.25))
    model.add(tf.keras.layers.Dense(3, activation='softmax'))
    model.compile(optimizer='sgd', loss='categorical_crossentropy', metrics=['accuracy'])
    model.fit(x_train, y_train, epochs=100)
    return model


def fine_tuning(x_train, y_train):
    tuner = BayesianOptimization(
        hypermodel=sequential_basic_cnn_fixed,
        objective='val_accuracy',
        max_trials=1,
        executions_per_trial=1,
        project_name='machine_teaching_base_cnn',
        overwrite=True)
    # Accuracy custom metric by estimated difficulty.
    # custom_accuracy = custom_metrics.AccuracyByDifficultyLevel(initialData, x_train, y_train)
    stop_early = tf.keras.callbacks.EarlyStopping(monitor='val_accuracy', patience=2)
    tuner.search(x_train, y_train, validation_split=0.30,
                 epochs=15,
                 callbacks=[stop_early])
    print(tuner.results_summary())
    optimized_hp = tuner.get_best_hyperparameters()[0]
    print(f"(HP) Best HP for the current state: {optimized_hp} ...")
    return tuner.hypermodel.build(optimized_hp)


def fine_tuning_curriculum(x_train_list, y_train_list):
    tuner = BayesianOptimization(
        hypermodel=sequential_curriculum_cnn_fixed,
        objective='val_accuracy',
        max_trials=1,
        executions_per_trial=1,
        project_name='machine_teaching_curriculum_cnn',
        overwrite=True)

    stop_early = tf.keras.callbacks.EarlyStopping(monitor='val_accuracy', patience=2)
    epochs = [3, 5, 12]
    for x_train, y_train, epoch in zip(x_train_list, y_train_list, epochs):
        tuner.search(x_train, y_train, validation_split=0.30, epochs=epoch, callbacks=[stop_early])

    print(tuner.results_summary())
    optimized_hp_curriculum = tuner.get_best_hyperparameters()[0]
    print(f"(HP) Best HP for curriculum state: {optimized_hp_curriculum} ...")
    return tuner.hypermodel.build(optimized_hp_curriculum)


def sequential_basic_cnn_fixed(hp):
    model = tf.keras.models.Sequential()
    model.add(tf.keras.layers.BatchNormalization())
    model.add(tf.keras.layers.Conv1D(filters=900,
                                     kernel_size=7,
                                     activation="relu", padding='same', input_shape=(16, 1)))
    model.add(tf.keras.layers.MaxPooling1D(pool_size=4))
    model.add(tf.keras.layers.Conv1D(filters=450,
                                     kernel_size=4,
                                     activation="relu",
                                     padding='same'))
    model.add(tf.keras.layers.MaxPooling1D(pool_size=2))
    model.add(tf.keras.layers.Dropout(0.2))
    model.add(tf.keras.layers.BatchNormalization())
    model.add(tf.keras.layers.Flatten())
    model.add(tf.keras.layers.Dense(128, "relu"))
    model.add(tf.keras.layers.Dropout(0.1))
    model.add(tf.keras.layers.Flatten())
    model.add(tf.keras.layers.Dense(3, activation='softmax'))
    model.compile(optimizer='adam',
                  loss='categorical_crossentropy',
                  metrics=['accuracy'])
    return model


def sequential_curriculum_cnn_fixed(hp):
    model = Sequential()
    model.add(BatchNormalization())

    # Configuración basada en los mejores resultados
    model.add(Conv1D(filters=400, kernel_size=4, activation="relu", padding='same', input_shape=(16, 1)))
    model.add(MaxPooling1D(pool_size=4, padding='same'))

    model.add(Dropout(0.25))
    model.add(BatchNormalization())
    model.add(Flatten())

    # Regularización L1L2 en la capa densa
    model.add(Dense(150, activation="relu", kernel_regularizer=l1_l2(l1=0.01, l2=0.01)))
    model.add(Dropout(0.1))

    model.add(Dense(3, activation='softmax'))
    model.compile(optimizer='adam', loss='categorical_crossentropy', metrics=['accuracy'])

    return model


def sequential_basic_cnn(hp):
    model = keras.models.Sequential()
    model.add(keras.layers.BatchNormalization())
    filters_base = hp.Int('filters_base', min_value=50, max_value=500, step=50)
    kernel_size_base = hp.Int('kernel_size_base', min_value=2, max_value=6, step=1)
    pool_base = hp.Int('pool_base', min_value=2, max_value=4, step=1)
    dropout_rate = hp.Float("dropout", min_value=0.1, max_value=0.3, step=0.1)
    dense_layer_units = hp.Int('dense_layer_units', min_value=50, max_value=1700, step=150)
    dropout_rate_1 = hp.Float("dropout_1", min_value=0.1, max_value=0.3, step=0.1)

    model.add(keras.layers.Conv1D(
        filters=filters_base,
        kernel_size=kernel_size_base,
        activation="relu", padding='same', input_shape=(16, 1)))
    model.add(keras.layers.MaxPooling1D(
        pool_size=pool_base, padding='same'))
    model.add(keras.layers.Dropout(dropout_rate))
    model.add(keras.layers.BatchNormalization())
    model.add(keras.layers.Flatten())
    model.add(keras.layers.Dense(
        dense_layer_units,
        activation="relu",
        kernel_regularizer=l1_l2(l1=0.01, l2=0.01)))
    model.add(keras.layers.Dropout(dropout_rate_1))
    model.add(keras.layers.Dense(3, activation='softmax'))
    model.compile(optimizer='adam',
                  loss='categorical_crossentropy',
                  metrics=['accuracy'])

    return model


def predict(model_name, tokenizer, word, padding=16):
    padding = max(padding, len(word))
    encoded = tokenizer.texts_to_sequences([word])
    padded = pad_sequences(encoded, maxlen=padding)
    model = get_pretrained_model(model_name)
    output = np.round(model.predict(np.expand_dims(padded, axis=2)))
    if len(output.shape) == 3 and output.shape[0] == 1:
        output = output.squeeze(axis=0)
    parsed_output = label_result_single(output, labels=["diptongo", "hiato", "ninguna"])
    return parsed_output


def load_new(model_name, curriculum=True, kfolds=True):

    base_model_name = "curriculum_under_trained"

    # Load the pre-trained model
    original_model = get_pretrained_model(base_model_name)

    # Clone the model
    copy = keras.models.clone_model(original_model)

    # Copy the weights from the original model to the cloned model
    copy.set_weights(original_model.get_weights())

    # Save the cloned model under the new model name
    save_pretrained_model(copy, name=model_name)



def delete_model(model_name):
    model_path = get_model_path(model_name)
    if not os.path.exists(model_path):
        raise FileNotFoundError(f"Model {model_name} does not exist")
    os.remove(model_path)


def get_model_path(model_name):
    base_dir = os.path.join(os.getcwd(), 'models')
    return os.path.join(base_dir, f"{model_name}.keras")


def evaluate(model_names, x_test, y_test):
    results = []
    for model_name in model_names:
        try:
            model = get_pretrained_model(model_name)
            print(f"(CL) Evaluating {model_name} ...")
            evaluation = model.evaluate(np.expand_dims(x_test, axis=2), y_test, verbose=0)

            metrics = {}
            for metric_name, value in zip(model.metrics_names, evaluation):
                metrics[metric_name] = value
            results.append({
                "model": model_name,
                "metrics": metrics
            })
        except Exception as e:
            print(f"Error evaluating {model_name}: {e}")
    return results


def train(model_name, x_train, y_train, validation_split=0.25, epochs=12):
    model = get_pretrained_model(model_name)
    train_model(model, model_name, x_train, y_train, validation_split, epochs)


def plot_model_history(history, validation_data=True):
    graph_utils.basic_plot(history, validation_data)


def plot_model_history_progression(history_progression, validation_data=True):
    graph_utils.plot_progression(history_progression, validation_data)


def train_model(model, model_name, x_train, y_train, validation_split=0.25, epochs=15):
    train_history = model.fit(np.expand_dims(x_train, axis=2), y_train,
                              validation_split=validation_split, epochs=epochs,
                              callbacks=[tf.keras.callbacks.EarlyStopping(monitor='val_accuracy', patience=2)])

    save_pretrained_model(model, name=model_name)
    model_histories[model_name] = train_history.history
    return train_history


def train_model_with_kfolds(model, model_name, x_train, y_train, epochs=15):
    k = 5
    skf = StratifiedKFold(n_splits=k, shuffle=True, random_state=42)
    aggregated_history = {'accuracy': [], 'loss': [], 'val_accuracy': [], 'val_loss': []}
    y_labels = np.argmax(y_train, axis=1)
    histories = []
    for fold, (train_idx, val_idx) in enumerate(skf.split(x_train, y_labels)):
        print(f"Training on fold {fold + 1}/{k}...")
        x_train_fold, x_val_fold = x_train[train_idx], x_train[val_idx]
        y_train_fold, y_val_fold = y_train[train_idx], y_train[val_idx]
        history = model.fit(np.expand_dims(x_train_fold, axis=2), y_train_fold,
                            validation_data=(np.expand_dims(x_val_fold, axis=2), y_val_fold),
                            epochs=epochs,
                            callbacks=[tf.keras.callbacks.EarlyStopping(monitor='val_accuracy', patience=2)])
        histories.append(history)
        for key in aggregated_history.keys():
            aggregated_history[key].extend(history.history[key])

    save_pretrained_model(model, name=model_name)
    model_histories[model_name] = aggregated_history
    return histories


def curriculum_train(model_name, x_train_list, y_train_list, validation_split=None, epochs=None):
    model = get_pretrained_model(model_name)
    curriculum_train_model(model, model_name, x_train_list, y_train_list, validation_split, epochs)


def curriculum_train_model(model, model_name, x_train_list, y_train_list, validation_split=None, epochs=None):
    if epochs is None:
        epochs = [2, 4, 8]
    if validation_split is None:
        validation_split = [0.15, 0.25, 0.30]
    if len(x_train_list) != len(y_train_list):
        raise Exception("x_train and y_train dataSet lists must match in size.")
    if len(validation_split) != len(epochs):
        raise Exception("x_train and y_train dataSet lists must match in size.")
    stacked_x_train = np.empty((0, 16))
    stacked_y_train = np.empty((0, 3))
    aggregated_history = {'accuracy': [], 'loss': [], 'val_accuracy': [], 'val_loss': []}
    # Curriculum learning with the best hp.
    curriculum_learning_progress = []
    for x, y, val, epochs in zip(x_train_list, y_train_list, validation_split, epochs):
        stacked_x_train = np.vstack((stacked_x_train, x))
        stacked_y_train = np.vstack((stacked_y_train, y))
        model_result = model.fit(np.expand_dims(stacked_x_train, axis=2), stacked_y_train,
                                 validation_split=val, epochs=epochs,
                                 callbacks=[tf.keras.callbacks.EarlyStopping(monitor='val_accuracy', patience=2)])
        curriculum_learning_progress.append(model_result)
        val_acc_per_epoch = model_result.history['val_accuracy']
        best_epoch = val_acc_per_epoch.index(max(val_acc_per_epoch)) + 1
        for key in aggregated_history.keys():
            aggregated_history[key].extend(model_result.history[key])
        print(val_acc_per_epoch[-1])
        print('Best epoch: %d' % (best_epoch,))
    save_pretrained_model(model, name=model_name)
    model_histories[model_name] = aggregated_history
    return curriculum_learning_progress


def curriculum_train_model_with_kfolds(model, model_name, x_train_list, y_train_list, epochs_list=None):
    if epochs_list is None:
        epochs_list = [3, 8, 15]
    k = 5
    skf = StratifiedKFold(n_splits=k, shuffle=True, random_state=42)
    aggregated_history = {'accuracy': [], 'loss': [], 'val_accuracy': [], 'val_loss': []}
    if len(x_train_list) != len(y_train_list):
        raise Exception("x_train and y_train dataSet lists must match in size.")
    if len(epochs_list) != len(x_train_list):
        raise Exception("Epochs list must match x_train_list size.")

    curriculum_learning_progress = []
    for x_train, y_train, epochs in zip(x_train_list, y_train_list, epochs_list):
        y_labels = np.argmax(y_train, axis=1)
        for fold, (train_idx, val_idx) in enumerate(skf.split(x_train, y_labels)):
            print(f"Curriculum learning on fold {fold + 1}/{k}...")
            x_train_fold, x_val_fold = x_train[train_idx], x_train[val_idx]
            y_train_fold, y_val_fold = y_train[train_idx], y_train[val_idx]

            history = model.fit(np.expand_dims(x_train_fold, axis=2), y_train_fold,
                                validation_data=(np.expand_dims(x_val_fold, axis=2), y_val_fold),
                                epochs=epochs,
                                callbacks=[tf.keras.callbacks.EarlyStopping(monitor='val_accuracy', patience=2)])
            curriculum_learning_progress.append(history)
            for key in aggregated_history.keys():
                aggregated_history[key].extend(history.history[key])

    save_pretrained_model(model, name=model_name)
    model_histories[model_name] = aggregated_history
    return curriculum_learning_progress


# Get AI model.
def get_pretrained_model(name="example", directory="models/", extension=".keras"):
    filepath = os.path.join(os.path.dirname(__file__), directory, name + extension)
    return keras.models.load_model(filepath)


# Save AI model.
def save_pretrained_model(model, name="example", directory="models/", extension=".keras"):
    if not name.endswith(extension):
        name += extension
    try:
        # Save model weights.
        model.save(directory + name)
    except:
        # In case weights have not yet been initialized
        model.build()
        model.save(directory + name)


# Teach new examples to the model. aqui
def teach(model_name, word_dictionary, tokenizer, padding=16):
    model = get_pretrained_model(model_name)
    added_x, added_y = list(word_dictionary.keys()), \
                       [machine_teaching.encode_target_to_integer(i) for i in word_dictionary.values()]
    padding = max(padding, len(max(added_x, key=len)))
    mt_x_encoded = tokenizer.texts_to_sequences(added_x)
    mt_x_encoded = pad_sequences(mt_x_encoded, maxlen=padding)
    mt_y_encoded = tf.keras.utils.to_categorical(added_y, num_classes=3)

    # Compile model again with lower learning rate to avoid over-adapting to new examples.
    optimizer = tf.keras.optimizers.Adam(learning_rate=0.000053)
    model.compile(optimizer=optimizer,
                  loss='categorical_crossentropy',
                  metrics=['accuracy'])

    result = \
        model.fit(np.expand_dims(mt_x_encoded, axis=2), mt_y_encoded, epochs=3,
                  validation_split=0.20,
                  callbacks=[tf.keras.callbacks.EarlyStopping(monitor='val_accuracy')])

    predictions = model.predict(np.expand_dims(mt_x_encoded, axis=2))
    # Now we guess it is the highest probability instead of retrieving N/A.
    max_indices = np.argmax(predictions, axis=1)
    predictions_rounded = np.zeros_like(predictions)
    predictions_rounded[np.arange(predictions_rounded.shape[0]), max_indices] = 1

    # Categorical back to user tag
    expected_labels = label_result(mt_y_encoded)
    predicted_labels = label_result(predictions_rounded)

    final_summary = np.column_stack((added_x, expected_labels, predicted_labels))
    save_pretrained_model(model, model_name)
    return result, final_summary


def label_result_single(prediction, labels=None):
    if labels is None:
        labels = ['d', 'h', 'g']
    print(labels)
    # Convert prediction to a numpy array if it's not already one
    prediction = np.array(prediction)
    print(prediction)
    # Find the index of the first occurrence of 1
    indices = np.where(prediction[0] == 1)[0]
    print(indices)
    if len(indices) > 0:
        return labels[indices[0]]

    return ''


def label_result(prediction, labels=None):
    if labels is None:
        labels = ['d', 'h', 'g']
    return [labels[np.where(row == 1)[0][0]] if np.any(row) else '' for row in prediction]


def train_missing_models(models_missing, models_to_train, x_train, y_train,
                         stacked_x_01, stacked_y_01, stacked_x_012, stacked_y_012):
    for model_name in models_missing:
        model = models_to_train[model_name]

        if model_name == "max.keras":
            train_model(model, model_name, x_train, y_train)
        elif model_name == "curriculum_max.keras":
            curriculum_train_model(model, model_name, stacked_x_012, stacked_y_012)
        elif model_name == "under_trained.keras":
            train_model(model, model_name, x_train, y_train, epochs=1)
        elif model_name == "curriculum_under_trained.keras":
            curriculum_train_model(model, model_name, stacked_x_01, stacked_y_01,
                                   validation_split=[0.15, 0.25], epochs=[1, 1])
        elif model_name == "max_k_folds.keras":
            train_model_with_kfolds(model, model_name, x_train, y_train)
        elif model_name == "curriculum_max_k_folds.keras":
            curriculum_train_model_with_kfolds(model, model_name, stacked_x_012, stacked_y_012)
        elif model_name == "under_trained_k_folds.keras":
            train_model_with_kfolds(model, model_name, x_train, y_train, epochs=1)
        elif model_name == "curriculum_under_trained_k_folds.keras":
            curriculum_train_model_with_kfolds(model, model_name, stacked_x_01, stacked_y_01, [1, 1])


def reset(x, y, x_train, y_train, x_train0, y_train0, x_increment_01, y_increment_01, x_increment_012, y_increment_012,
          models_missing=None):
    if models_missing is None:
        models_missing = []
    # Initial configuration.
    tf.keras.backend.clear_session()

    # Stack in iterations for curriculum learning.
    stacked_x_01 = [x_train0, x_increment_01]
    stacked_y_01 = [y_train0, y_increment_01]
    stacked_x_012 = [x_train0, x_increment_01, x_increment_012]
    stacked_y_012 = [y_train0, y_increment_01, y_increment_012]
    stacked_x_012_expanded = [np.expand_dims(x, axis=2) for x in stacked_x_012]

    # Fine-tuning, training and evaluation. We use the full dataSet to find the best hp.
    best_model = fine_tuning(np.expand_dims(x, axis=2), y)

    # Fine-tuning curriculum learning adapted.
    best_model_curriculum = fine_tuning_curriculum(stacked_x_012_expanded, stacked_y_012)

    # Initialize weights to be able to store the model in a temp file.
    best_model.build((None, 16, 1))
    # Initialize weights to be able to store the model in a temp file, curriculum.
    best_model_curriculum.build((None, 16, 1))

    # Serialize best model into a temporal .keras file.
    serialize_model(best_model)

    # Deserialize the model to create every necessary copy.
    conventional_max = deserialize_model()
    conventional_under_trained = deserialize_model()
    conventional_max_k_folds = deserialize_model()
    conventional_under_trained_k_folds = deserialize_model()

    os.remove("temp_model.keras")
    serialize_model(best_model_curriculum)

    curriculum_max = deserialize_model()
    curriculum_under_trained = deserialize_model()
    curriculum_max_k_folds = deserialize_model()
    curriculum_under_trained_k_folds = deserialize_model()

    os.remove("temp_model.keras")

    models_to_train = {
        "max.keras": conventional_max,
        "curriculum_max.keras": curriculum_max,
        "under_trained.keras": conventional_under_trained,
        "curriculum_under_trained.keras": curriculum_under_trained,
        "max_k_folds.keras": conventional_max_k_folds,
        "curriculum_max_k_folds.keras": curriculum_max_k_folds,
        "under_trained_k_folds.keras": conventional_under_trained_k_folds,
        "curriculum_under_trained_k_folds.keras": curriculum_under_trained_k_folds
    }
    train_missing_models(models_missing, models_to_train, x_train, y_train,
                         stacked_x_01, stacked_y_01, stacked_x_012, stacked_y_012)


# Helpful functions to serialize and deserialize models.
def serialize_model(model, filename="temp_model.keras"):
    model.save(filename)


def deserialize_model(filename="temp_model.keras"):
    return tf.keras.models.load_model(filename)
