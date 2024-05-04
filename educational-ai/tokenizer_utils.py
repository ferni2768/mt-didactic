import string


def customize_word_index(dictionary):
    for key in dictionary.keys():
        dictionary[key] = __get_index_for_token(key)
    return dictionary


def __get_index_for_token(char):
    # Eliminar puntuación
    char = char.lower().translate(str.maketrans('', '', string.punctuation))

    # Diccionario para vocales abiertas y cerradas
    vowel_switcher = {
        'a': 1,  # Vocal abierta
        'e': 1,  # Vocal abierta
        'i': 2,  # Vocal cerrada
        'o': 1,  # Vocal abierta
        'u': 2,  # Vocal cerrada
    }

    # Diccionario para vocales acentuadas
    accented_vowel_switcher = {
        'á': 3,  # Vocal abierta acentuada
        'é': 3,  # Vocal abierta acentuada
        'í': 4,  # Vocal cerrada acentuada
        'ó': 3,  # Vocal abierta acentuada
        'ú': 4,  # Vocal cerrada acentuada
    }

    # Verificar si es vocal acentuada, si no, verificar si es vocal normal o consonante
    return accented_vowel_switcher.get(char, vowel_switcher.get(char, 0))


def __one_hot_encode_char(char):
    # Incluir letras minúsculas, dígitos, puntuación y vocales acentuadas en minúsculas
    all_chars = string.ascii_lowercase + string.digits + string.punctuation + "áéíóúüñ"
    # Preprocesar la entrada para convertirla en minúsculas
    char = char.lower()
    # Crear un diccionario que mapea cada caracter a su representación one-hot
    one_hot_dict = {c: [1 if c == ch else 0 for ch in all_chars] for c in all_chars}
    return one_hot_dict.get(char, [0] * len(all_chars))
