from pandas import read_csv, DataFrame
from pandas import concat
import numpy as np
import random


def split_data(dataset, target_col):
    x = dataset.values[:, 0:2]
    y = dataset.values[:, target_col]
    return x, y


def remove_whitespaces(dataset):
    return np.char.strip(dataset)


def replace_consonants(word, consonants):
    # Replace each consonant in the word with a random consonant
    return ''.join([char if char.lower() not in consonants else random.choice(consonants) for char in word])


def generate_fake_words(df):
    consonants = "bcdfghjklmnpqrstvwxyz"  # Define your list of consonants
    modified_df = df.copy()
    modified_df[0] = df[0].apply(lambda word: replace_consonants(word, consonants))
    return modified_df


def generate_fake_words(df, num_fake_words=10):
    consonants = "bcdfghjklmnpqrstvwxyz"  # Define your list of consonants
    fake_words = []
    for _, row in df.iterrows():
        for _ in range(num_fake_words):
            fake_word = replace_consonants(row[0], consonants)
            # Append the new row with the fake word and other columns from the original row
            fake_words.append({0: fake_word, **{col: row[col] for col in df.columns if col != 0}})

    return DataFrame(fake_words)


def load_dataset(filename, word_column, difficulty_column, target_column):
    # load the dataset as a pandas DataFrame
    return read_csv(filename, header=0, encoding='latin1', sep=';',
                    keep_default_na=False, usecols=[word_column, difficulty_column, target_column])


def load_full_dataset(filename):
    # load the dataset as a pandas DataFrame
    return read_csv(filename, header=0, encoding='latin1', sep=';', keep_default_na=False)


def split_by_difficulty(dataframe):
    return dataframe[dataframe['DIFICULTAD'] == 0], \
           dataframe[dataframe['DIFICULTAD'] == 1], \
           dataframe[dataframe['DIFICULTAD'] == 2]


def shuffle_datasets(dataframe1, dataframe2, dataframe3):
    dataframes = [dataframe1, dataframe2, dataframe3]
    for df in dataframes:
        df.columns = [0, 1, 2]
        df.reset_index(drop=True, inplace=True)
    return concat([dataframe1, dataframe2, dataframe3], axis=0)
