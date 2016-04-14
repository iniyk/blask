import sys
from optparse import OptionParser
import json


def trans(number):
    return str(number)


def load_json(input_file_name):
    with open(input_file_name, 'rU') as f:
        data = json.load(f)
    return map(trans, data['fields']['target-field'])


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
    data = dict()
    data['transed-target-fields'] = load_json(options.input)
    dump_json(options.output, data)