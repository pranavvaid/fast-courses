"""
Your module description
"""
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


def determineAllRequiredPrerequisites(classToDetermine):
    allRequiredClasses = set([])
    if (classToDetermine.prerequisites is None) or len(classToDetermine.prerequisites) == 0 :
        return allRequiredClasses
    for preReqCourse in classToDetermine.prerequisites:
        allRequiredClasses.add(preReqCourse)
        allRequiredClasses.update(determineAllRequiredPrerequisites(preReqCourse))
    return allRequiredClasses

if __name__ == "__main__":
    with open('prereqs/stanfordclasslist.pkl', 'rb') as data:
        StanfordClassList = pickle.load(data)
    message = ""
    classToDetermine = retrieveClass(StanfordClassList, className = argv[1])
    if classToDetermine is None:
        message = "Oops!! That course isn't offered at Stanford"
    else:
        allClasses = determineAllRequiredPrerequisites(classToDetermine)
        print("+".join([course.name for course in allClasses]))

