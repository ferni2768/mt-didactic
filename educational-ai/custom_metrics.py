import itertools

import numpy as np
import tensorflow
from tensorflow.python.keras.metrics import Accuracy


class AccuracyByDifficultyLevel(tensorflow.keras.metrics.Metric):
    def __init__(self, name='accuracy_by_difficulty', **kwargs):
        super(AccuracyByDifficultyLevel, self).__init__(name=name, **kwargs)
        self.accuracy_easy = self.add_weight(name='acc_0', initializer='zeros')
        self.accuracy_medium = self.add_weight(name='acc_1', initializer='zeros')
        self.accuracy_hard = self.add_weight(name='acc_2', initializer='zeros')

    def update_state(self, y_true, y_pred, sample_weight=None):
        grouped_validation = self._group_by_difficulty_level(y_true, y_pred)
        for key, group in grouped_validation:
            my_list = list(group)
            my_result_subarray = my_list[0][-4:-1]
            my_group = my_list[0][:-4]
            my_prediction = self.model.predict(np.expand_dims(np.asarray(my_group).astype('float32'), axis=1))[1]
            accuracy = Accuracy().update_state(np.asarray(my_result_subarray).astype('float32'),
                                               (my_prediction == my_prediction.max(axis=0, keepdims=True)).astype(int))
            print("Accuracy by key {}: {}", key, accuracy.result())
            self.model.history["accuracy_by_difficulty_" + str(key)] = accuracy

    def _set_up_prediction_dataset(self, y_true, y_pred):
        return np.column_stack(y_pred, y_true)

    def _group_by_difficulty_level(self, y_true, y_pred):
        key_func = lambda x: x[x.shape[0] - 1]
        return itertools.groupby(self._set_up_prediction_dataset(y_true, y_pred), key_func)

    def result(self):
        return self.accuracy_easy, self.accuracy_medium, self.accuracy_hard

    def reset_states(self):
        self.accuracy_easy.assign(0)
        self.accuracy_medium.assign(0)
        self.accuracy_hard.assign(0)
