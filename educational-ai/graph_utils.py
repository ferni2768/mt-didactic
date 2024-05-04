import matplotlib.pyplot as plt
from numpy import random


def random_line_color():
    return plt.cm.gist_ncar(random.random())


def plot_history(acc, val_acc, loss, val_loss, validation, iter_per_stage=None):
    if iter_per_stage is None:
        iter_per_stage = []
    x = range(1, len(acc) + 1)
    plt.figure(figsize=(10, 5))
    plt.xlabel("epoch")
    plt.ylabel("metric value")
    plt.subplot(1, 2, 1)
    for iteration in iter_per_stage:
        plt.axvline(x=iteration, linestyle='dashed')
    plt.plot(x, acc, color='b', label='Training accuracy')
    if validation:
        plt.plot(x, val_acc, 'r', label='Validation accuracy')
    plt.title('Training and validation metrics.')
    plt.legend(loc='upper left')
    plt.subplot(1, 2, 2)
    for iteration in iter_per_stage:
        plt.axvline(x=iteration, linestyle='dashed')
    plt.plot(x, loss, 'b', label='Training loss')
    if validation:
        plt.plot(x, val_loss, 'r', label='Validation loss')
    plt.title('Training and validation loss')
    plt.legend(loc='upper left')
    plt.show()


def basic_plot(history, validation):
    print(history.history.keys())
    acc = history.history['accuracy']
    loss = history.history['loss']
    val_acc = None
    val_loss = None
    if validation:
        val_acc = history.history['val_accuracy']
        val_loss = history.history['val_loss']
    plot_history(acc, val_acc, loss, val_loss, validation)


def plot_progression(stacked_history, validation):
    acc = []
    val_acc = []
    loss = []
    val_loss = []
    iter_per_stage = []
    for history in stacked_history:
        iter_per_stage.append(len(history.history['accuracy']))
        acc.append(history.history['accuracy'])
        loss.append(history.history['loss'])
        if validation:
            val_acc.append(history.history['val_accuracy'])
            val_loss.append(history.history['val_loss'])
    acc = [item for sublist in acc for item in sublist]
    val_acc = [item for sublist in val_acc for item in sublist]
    loss = [item for sublist in loss for item in sublist]
    val_loss = [item for sublist in val_loss for item in sublist]
    plot_history(acc, val_acc, loss, val_loss, validation, iter_per_stage)
