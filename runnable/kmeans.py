import sys
from optparse import OptionParser
import json
import string

from sklearn.cluster import KMeans
from sklearn.externals import joblib
import numpy


def load_json(input_file_name):
    with open(input_file_name, 'rU') as f:
        data = json.load(f)
    return data


def gClasses(X, n_cluster):
    clf = KMeans(n_clusters=n_cluster)
    s = clf.fit(X)
    return s.labels_


def dump_json(output_file_name, data):
    with open(output_file_name, 'w') as f:
        json.dump(data, f)


if __name__ == "__main__":
    optparser = OptionParser()
    optparser.add_option('-f', '--inputFile',
                         dest='input',
                         help='filename containing json for input',
                         default=None)
    optparser.add_option('-o', '--outputFile',
                         dest='output',
                         help='filename containing json for output',
                         default=None)
    (options, args) = optparser.parse_args()
    if options.input is None:
        print('No dataset filename specified, system with exit\n')
        sys.exit('System will exit')
    if options.output is None:
        print('No dataset filename specified, system with exit\n')
        sys.exit('System will exit')

    data = load_json(options.input)
    y = gClasses(zip(*data['fields']['vector']), string.atoi(data['n_clusters']))
    result = dict()
    result['vector'] = zip(*data['fields']['vector'])
    result['class'] = y.tolist()
    dump_json(options.output, result)