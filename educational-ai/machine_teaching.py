static_dictionaries = [{
    'torpe': 'g',
    'gourmet': 'd',
    'vacío': 'h',
    'mío': 'h',
    'palabra': 'g',
    'hueso': 'd',
    'violenta': 'd',
    'ordenador': 'g',
    'peineta': 'd',
    'ahínco': 'h',
    'patata': 'g',
    'ciudadela': 'd',
    'frío': 'h',
    'ataúd': 'h',
    'aceituna': 'd'
    },
    {
        'ahorrador': 'h',
        'licor': 'g',
        'baúl': 'h',
        'pausado': 'd',
        'fumador': 'g',
        'causalidad': 'd',
        'monerías' 'h'
        'navío': 'h',
        'hueso': 'd',
        'heroína': 'h',
        'oigo': 'd',
        'aullar': 'd',
        'caudaloso': 'd',
        'Pedro': 'g',
        'bailecito': 'd'
    },
    {
        'mareo': 'h',
        'confíe': 'h',
        'despeinarse': 'd',
        'mía': 'h',
        'día': 'h',
        'autoridad': 'd',
        'gaucho': 'd',
        'Eugenia': 'd',
        'sorprendido': 'g',
        'reinado': 'd',
        'ambiguo': 'd',
        'caer': 'h',
        'lata': 'g',
        'chiita': 'h',
        'vaso': 'g',
    }]
load_static = True


def ask_for_new_examples(num_examples, iteration=0):
    counter = 0
    examples = []
    targets = []
    if load_static:
        return static_dictionaries[iteration].keys(),\
               [encode_target_to_integer(i) for i in static_dictionaries[iteration].values()]
    while counter < num_examples:
        target = input("Choose the example type between 'diphthong', 'hiatus', 'none: ['d', 'h', 'g']")
        if (not target) or (target not in {"d", "h", "g"}):
            print("Please choose a valid class for the input!")
            continue
        example = input('Enter a new ' + target + ':')
        examples.append(example)
        targets.append(encode_target_to_integer(target))
        counter += 1
    return examples, targets


def encode_target_to_integer(target):
    match target:
        case 'D':
            return 0
        case 'H':
            return 1
        case 'G':
            return 2
        case _:
            return 2

def decode_binary_to_target(binary):
    match binary:
        case [1, 0, 0]:
            return 'D'
        case [0, 1, 0]:
            return 'H'
        case [0, 0, 1]:
            return 'G'
        case _:
            return 2
