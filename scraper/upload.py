import os
import sys
import argparse
import json
from glob import glob
from algoliasearch.search_client import SearchClient


def get_index():
    client = SearchClient.create(
        os.getenv('ALGOLIA_ACCOUNT'),
        os.getenv('ALGOLIA_TOKEN')
    )

    return client.init_index(os.getenv('ALGOLIA_INDEX'))


def process_file(name, f, index):
    print('  Uploading', name)
    try:
        courses = json.load(f)
        res = index.save_objects(courses)
        print('    Got Algolia res', res)
    except Exception as e:
        print('  Error encountered processing', name, e)
        return
    print('  Uploaded', name)


def main():
    parser = argparse.ArgumentParser(description='fast-courses upload')
    parser.add_argument('--pattern', '-p', type=str)
    parser.add_argument('files', nargs='*', type=argparse.FileType('r'),
                        default=[sys.stdin])
    args = parser.parse_args()

    print('Uploading serialized JSON to Algolia...')

    if args.pattern:
        names = glob(args.pattern)
        files = [open(n, 'r') for n in names]
    else:
        files = args.files

    index = get_index()

    for f in files:
        process_file(f.name, f, index)

    print('Finished uploading serialized JSON to Algolia...')


if __name__ == '__main__':
    main()
