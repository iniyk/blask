"""
Description     : Simple Python implementation of the Apriori Algorithm

Usage:
    $python apriori.py -f DATASET.csv -s minSupport  -c minConfidence

    $python apriori.py -f DATASET.csv -s 0.15 -c 0.6
"""

import sys

from itertools import chain, combinations
from collections import defaultdict
from optparse import OptionParser
import json
import string


def subsets(arr):
    """ Returns non empty subsets of arr"""
    return chain(*[combinations(arr, i + 1) for i, a in enumerate(arr)])


def returnItemsWithMinSupport(itemSet, transactionList, minSupport, freqSet):
        """calculates the support for items in the itemSet and returns a subset
       of the itemSet each of whose elements satisfies the minimum support"""
        _itemSet = set()
        localSet = defaultdict(int)

        for item in itemSet:
                for transaction in transactionList:
                        if item.issubset(transaction):
                                freqSet[item] += 1
                                localSet[item] += 1

        for item, count in localSet.items():
                support = float(count)/len(transactionList)

                if support >= minSupport:
                        _itemSet.add(item)

        return _itemSet


def joinSet(itemSet, length):
        """Join a set with itself and returns the n-element itemsets"""
        return set([i.union(j) for i in itemSet for j in itemSet if len(i.union(j)) == length])


def getItemSetTransactionList(data_iterator):
    transactionList = list()
    itemSet = set()
    for record in data_iterator:
        transaction = frozenset(record)
        transactionList.append(transaction)
        for item in transaction:
            itemSet.add(frozenset([item]))              # Generate 1-itemSets
    return itemSet, transactionList


def runApriori(data_iter, minSupport, minConfidence):
    """
    run the apriori algorithm. data_iter is a record iterator
    Return both:
     - items (tuple, support)
     - rules ((pretuple, posttuple), confidence)
    """
    itemSet, transactionList = getItemSetTransactionList(data_iter)

    freqSet = defaultdict(int)
    largeSet = dict()
    # Global dictionary which stores (key=n-itemSets,value=support)
    # which satisfy minSupport

    assocRules = dict()
    # Dictionary which stores Association Rules

    oneCSet = returnItemsWithMinSupport(itemSet,
                                        transactionList,
                                        minSupport,
                                        freqSet)

    currentLSet = oneCSet
    k = 2
    while(currentLSet != set([])):
        largeSet[k-1] = currentLSet
        currentLSet = joinSet(currentLSet, k)
        currentCSet = returnItemsWithMinSupport(currentLSet,
                                                transactionList,
                                                minSupport,
                                                freqSet)
        currentLSet = currentCSet
        k = k + 1

    def getSupport(item):
            """local function which Returns the support of an item"""
            return float(freqSet[item])/len(transactionList)

    toRetItems = []
    for key, value in largeSet.items():
        toRetItems.extend([(tuple(item), getSupport(item))
                           for item in value])

    toRetRules = []
    for key, value in largeSet.items()[1:]:
        for item in value:
            _subsets = map(frozenset, [x for x in subsets(item)])
            for element in _subsets:
                remain = item.difference(element)
                if len(remain) > 0:
                    confidence = getSupport(item)/getSupport(element)
                    if confidence >= minConfidence:
                        toRetRules.append(((tuple(element), tuple(remain)),
                                           confidence))
    return toRetItems, toRetRules


def printResults(items, rules, outFile):
    """prints the generated itemsets sorted by support and the confidence rules sorted by confidence"""
    # for item, support in sorted(items, key=lambda (item, support): support):
    result = dict()
    result['pre'] = list()
    result['post'] = list()
    result['confidence'] = list()
    for rule, confidence in sorted(rules, key=lambda (rule, confidence): confidence ):
        pre, post = rule
        pre_list = list()
        post_list = list()
        result['confidence'].append(float(confidence))
        for pre_item, post_item in zip(pre, post):
            pre_list.append(pre_item)
            post_list.append(post_item)
        result['pre'].append(pre_list)
        result['post'].append(post_list)

    with open(outFile, 'w') as f:
        json.dump(result, f)


def gListByLine(data):
    records = dict()
    for item_list, item in zip(data['fields']['list'], data['fields']['item']):
        #print(item_list, item)
        if item_list not in records:
            records[item_list] = set()
        records[item_list].add(item)
    # for record_name, record in records.items():
    #     print record_name, ' ', record
    for record_name, record in records.items():
        yield frozenset(record)


def dataFromFile(fname):
    if fname.endswith('json'):
        with open(fname, 'rU') as f:
            data = json.load(f)
        # TODO: Trans them to float!!!!
        return string.atof(data['min_support']), string.atof(data['min_confidence']), gListByLine(data)


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

    minSupport, minConfidence, inFile = dataFromFile(options.input)
    items, rules = runApriori(inFile, minSupport, minConfidence)
    printResults(items, rules, options.output)
