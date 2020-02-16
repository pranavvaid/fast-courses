class StanfordClass:
    def __init__(self, title, description, minUnits, maxUnits, name, prerequisites, prereqsOf):
        self.title = title
        self.description = description
        self.minUnits = minUnits
        self.maxUnits = maxUnits
        self.name = name
        self.prerequisites = prerequisites
        self.prereqsOf = prereqsOf
    
    def setPrereqs(prereqs):
        self.preqrequisites = preqreqs

    def setPrereqsof(prereqs):
        self.prereqsOf = preqreqs

    def printOutCourse(self):
        print("------------------------------------------------------------------------------------------------------")
        print(self.name + ": " + self.title)
        print("")
        print(self.description)
        print("")
        if self.minUnits != self.maxUnits:
            print("UNITS: " + str(self.minUnits) + "-" + str(self.maxUnits))
        else:
            print("UNITS: " + str(self.minUnits))
        prereqstring = ""
        for preReq in self.prerequisites:
            prereqstring += preReq.name + ", "
        prereqOfstring = ""
        for prereqOf in self.prereqsOf:
            prereqOfstring += prereqOf.name + ", "
        if prereqstring != "":
            prereqstring = prereqstring[:-2]
        if prereqOfstring != "":
            prereqOfstring = prereqOfstring[:-2]
        print("Prerequisites: " + prereqstring)
        print("This course is a prequisite for: " + prereqOfstring)
        print("------------------------------------------------------------------------------------------------------")
    def __repr__(self):
        return '{}: {}'.format(self.name, self.title)
        #return 'StanfordClass({}, {}, {}, {})'.format(self.name, self.title, self.minUnits, self.maxUnits)
    def __hash__(self):
        return hash(repr(self))
