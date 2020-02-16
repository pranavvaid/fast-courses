from stanfordclasses import StanfordClass
import pickle
from sys import argv

def list_contains(sublist, mainlist):
    if all(x in mainlist for x in sublist):
        return True
    return False

def retrieveClass(classlist, classTitle = "", className = ""):
    if className != "":
        className = className.replace(" ", "")
        return next((x for x in classlist if x.name.upper().replace(" ", "") == className.upper()), None)
    if classTitle != "":
        return next((x for x in classlist if x.title.upper() == classTitle.upper()), None)
    return None

def determineFutureClasses(completedClassesList, StanfordClassList):
    possibleFutureClasses = set([])
    for completedClass in completedClassesList:
        classToCheck = retrieveClass(StanfordClassList, className = completedClass)
        if classToCheck is not None:
            possibleFutureClasses.update(classToCheck.prereqsOf)
    actualFutureClasses = set([])
    for possibleFutureClass in possibleFutureClasses:
        preReqsOfFutureClass = possibleFutureClass.prerequisites
        if list_contains([c.name for c in preReqsOfFutureClass], completedClassesList):
            actualFutureClasses.add(possibleFutureClass)
    return actualFutureClasses

if __name__ == "__main__":
    with open('prereqs/stanfordclasslist.pkl', 'rb') as data:
        StanfordClassList = pickle.load(data)
    allClasses = determineFutureClasses(argv[1].split("-"), StanfordClassList)
   
    print('+'.join([c.name for c in allClasses]))
