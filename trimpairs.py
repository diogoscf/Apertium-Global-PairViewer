"""
Python script used to filter out the pairs in pairs.json.txt that do not contain
languages with coordinates in the tsv file
"""

import json


def filter_pairs(filename, languages, alt_codes):
    """
    Filters out any language that is not in
    the list of valid languages
    """

    pair_file = open(filename, "r")
    filtered = []
    for line in pair_file:
        line = line.strip().split()

        lang1 = line[3][1:-2]
        lang2 = line[1][1:-2]

        if lang1 in languages and lang2 in languages:
            # Getting rid of last comma
            line[-1] = line[-1][:-1]
            joined = " ".join(line)
            filtered.append(joined)

        elif (
                lang1 in alt_codes and alt_codes[lang1] in languages
        ) and (
            lang2 in alt_codes and alt_codes[lang2] in languages
        ):
            # Getting rid of last comma
            line[-1] = line[-1][:-1]
            line[1] = line[1][0] + alt_codes[lang2] + line[1][-2:]
            line[3] = line[3][0] + alt_codes[lang1] + line[3][-2:]
            joined = " ".join(line)
            filtered.append(joined)

    pair_file.close()
    return filtered


def get_languages_with_coords(filename):
    """
    Gets the languages with their coordinates
    on the Earth
    """

    lang_file = open(filename, "r")
    lang_dict = {}
    for line in lang_file:
        line = line.strip().split(",")
        lat, lon = float(line[1]), float(line[2])
        lang_dict[line[0]] = [lon, lat]
    lang_file.close()
    return lang_dict


def get_alternate_codes(filename):
    """
    Reads the alternate codes for languages from file
    and then returns a dict of that data
    """

    code_file = open(filename, 'r')
    code_str = code_file.read()
    code_file.close()
    return json.loads(code_str)

if __name__ == "__main__":
    LANG_DICT = get_languages_with_coords("apertium-languages.tsv")
    ALT_CODES = get_alternate_codes('codes.json')
    FILTERED = filter_pairs("pairs.json.txt", LANG_DICT, ALT_CODES)
    APERTIUM_FILE = open("apertiumPairs.json", "w")

    APERTIUM_FILE.write("{\n")
    APERTIUM_FILE.write('"type": "FeatureCollection",\n')
    APERTIUM_FILE.write('"pairs": [\n')
    for line in FILTERED[:-1]:
        APERTIUM_FILE.write("\t"+line+"\n")
        APERTIUM_FILE.write(",\n")

    APERTIUM_FILE.write("\t"+FILTERED[-1]+"\n")

    APERTIUM_FILE.write("]\n")
    APERTIUM_FILE.write("}")

    APERTIUM_FILE.close()

    APERTIUM_FILE2 = open("apertiumPoints.json", "w")
    APERTIUM_FILE2.write("{\n")
    APERTIUM_FILE2.write('"type": "FeatureCollection",\n')

    # Writing point coordinates
    APERTIUM_FILE2.write('"point_data": [\n')
    LANG_ARR = []
    for code in sorted(LANG_DICT.keys()):
        LANG_ARR.append([code, LANG_DICT[code]])

    for lang in LANG_ARR[:-1]:
        STRING = '{"type": "Feature", "tag": "' + lang[0] + '", ' + '"geometry": { "type": "Point", ' + '"coordinates": ' + str(lang[1]) + "} }\n"
        APERTIUM_FILE2.write("\t" + STRING)
        APERTIUM_FILE2.write(",\n")

    STRING = '{"type": "Feature", "tag": "' + LANG_ARR[-1][0] + '", ' + '"geometry": { "type": "Point", ' + '"coordinates": ' + str(LANG_ARR[-1][1]) + "} }\n"
    APERTIUM_FILE2.write("\t" + STRING)

    APERTIUM_FILE2.write("]\n")
    APERTIUM_FILE2.write("}")

    APERTIUM_FILE2.close()
