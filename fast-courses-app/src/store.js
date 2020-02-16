import { useEffect, useState } from 'react';
import algoliasearch from 'algoliasearch/lite';
import ReactGA from 'react-ga';

import { CURRENT_YEAR } from './config';

let HAS_INITIAL_FETCHED = false;

export const searchClient = algoliasearch(
  process.env.REACT_APP_ALGOLIA_ACCOUNT,
  process.env.REACT_APP_ALGOLIA_TOKEN,
  { _useRequestCache: true }
);
export const searchIndex = searchClient.initIndex(process.env.REACT_APP_ALGOLIA_INDEX);

let courseCache = {};
let cache = {};

const makeCacheEntry = (hit, section) => {
  return {
    objectID:  hit.objectID,
    number: hit.number,
    title: hit.title,
    units: +hit.unitsMax,
    ...section
  };
}

const fetchExtendedCourse = (id) => {
  return fetch(`${process.env.REACT_APP_ENDPOINT}courses/${id}`, { credentials: 'include' })
    .then(r => r.json());
}

const fetchPrereqs = (courses) => {
  return fetch(`${process.env.REACT_APP_ENDPOINT}prereqs?classes=${courses.join("-")}`, { credentials: 'include' })
    .then(r => r.text());
}

async function fetchPrereqsAll(courses) {
  let promises = courses.map(course => (fetchPrereqs([course.number]).then((res, err) => {course.reqs = res.split("+")})));
  await Promise.all(promises);
}

export { fetchPrereqsAll, fetchPrereqs }

const persistUpdate = ({ field, op, value }) => {
  return fetch(`${process.env.REACT_APP_ENDPOINT}self`, {
    method: 'POST',
    credentials: 'include',
    body: JSON.stringify({
      field, op, value
    }),
    headers: { 'content-type': 'application/json' }
  })
  .then(r => r.json())
  .catch(e => {
    console.error(e);
    window.alert(`Failed to save changes. Are you offline, or perhaps did your COLLEGE_NAME authentication token expire? Please refresh and try again, sorry :-(`);
  });
}

export const useStore = ({ user }) => {
  const [appData, setAppData] = useState({ planner_start_year: CURRENT_YEAR.year, classes: [], planner: {}, planner_settings: {} });
  const [extendedData, setExtendedData] = useState({});
  const [courseLoadSentinel, setCourseLoadSentinel] = useState(null);

  // On initial load, fetch courses for user
  useEffect(() => {
    if (!user) {
      return;
    }

    const classes = user.classes;
    const plannedCourses = Object.values(user.planner).reduce((c, t) => c.concat(t), []);

    if ((classes.length || plannedCourses.length) && !HAS_INITIAL_FETCHED) {
      HAS_INITIAL_FETCHED = true;

      const filters = user.classes.map(c => {
        const classId = c.split('|')[1];
        return `sections.classId:${classId}`;
      }).concat(plannedCourses.map(c => {
        return `objectID:${c}`
      })).join(' OR ');

      searchIndex.search({
        query: '',
        filters: filters,
        hitsPerPage: 1000,
      }, (err, res) => {
        if (err) { return window.alert('Unable to fetch classes: ' + err.message); }
        const newCache = res.hits.reduce((updated, hit) => {
          courseCache[hit.objectID] = hit;
          hit.sections.forEach(section => {
            updated[`${hit.number}|${section.classId}`] = makeCacheEntry(hit, section);
          });
          return updated;
        }, {});
        Object.assign(cache, newCache);
        setAppData({ ...appData,
          classes: user.classes,
          planner_start_year: user.planner_start_year,
          planner: user.planner,
          planner_settings: user.planner_settings,
        });
      });
    }
  }, [user, appData, setAppData]);

  const generated = {
    appData,

    getCourse: (course) => {
      let cached = courseCache[course.id] || courseCache[course.slugName];
      if (cached) {
        return cached;
      } else {
        let searchQuery;

        if (course.id) {
          searchQuery = { filters: `objectID:${course.id}` };
        } else {
          let match = /\d/.exec(course.slugName);
          if (match) {
            searchQuery = { query: `${course.slugName.substring(0, match.index).trim().toUpperCase()} ${course.slugName.substring(match.index)}` };
          }
        }

        const setCacheEntry = hit => {
          let id = course.id || hit.objectID;
          if (id) { courseCache[id] = hit; }
          if (course.slugName) { courseCache[course.slugName] = hit; }
          setCourseLoadSentinel(hit); // fire an update
        }

        if (!searchQuery) {
          const error = { error: `Unable to load course: Invalid course "${course.slugName}"` };
          setCacheEntry(error);
          return error;
        }

        searchIndex.search({
          ...searchQuery,
          hitsPerPage: 1,
        }, (err, res) => {
          if (err) {
            setCacheEntry({ error: `Unable to load course: ${err.message}` });
            return;
          }

          if (res.hits.length) {
            setCacheEntry(res.hits[0]);
          } else {
            setCacheEntry({ error: `Course not found: ${course.slugName || course.id}` });
          }
        });

        setCacheEntry({ loading: true });
        return { loading: true };
      }
    },

    // Classes / Scheduler
    hasClass: id => {
      return appData.classes.indexOf(id) !== -1;
    },
    addClass: (id, hit, section) => {
      Object.assign(cache, { [id]: makeCacheEntry(hit, section) });
      courseCache[hit.objectID] = hit;
      setAppData({ ...appData, classes: appData.classes.concat(id) })
      ReactGA.event({ category: 'Calendar', action: 'Add class', label: id });
      persistUpdate({ field: 'classes', op: '$addToSet', value: id });
    },
    removeClass: id => {
      if (appData.classes.indexOf(id) === -1) { return; }
      setAppData({ ...appData, classes: appData.classes.filter(c => c !== id) })
      ReactGA.event({ category: 'Calendar', action: 'Remove class', label: id });
      persistUpdate({ field: 'classes', op: '$pull', value: id });
    },
    removeClassesForCourse: (termId, course) => {
      let { classes } = appData;
      course.sections.filter(s => s.termId === termId).forEach(s => {
        classes = classes.filter(c => c !== `${course.number}|${s.classId}`);
      });
      setAppData({ ...appData, classes });
      persistUpdate({ field: 'classes', op: '$set', value: classes });
    },
    getAllClasses: () => {
      const planner = user.planner;
      const class_ids = Object.keys(planner).map(key => planner[key]).reduce((a, b) => a.concat(b), []);

      return class_ids;
    },
    getClassesForTerm: termId => {
      const classes = appData.classes.map(c => cache[c]).filter(c => c && c.termId === termId);

      // In the case of LEC+DIS combo classes, ensure we only count units once
      const indexedCourses = classes.reduce((o, c) => {
        if (o[c.number]) {
          o[c.number].multiple = true;
          o[c.number].components.push(c.component);
        } else {
          o[c.number] = c;
          o[c.number].components = [c.component];
        }
        return o;
      }, {});

      const courses = Object.values(indexedCourses);

      return { classes, indexedCourses, courses };
    },

    // General Data
    getExtendedData: id => {
      if (extendedData[id]) {
        return extendedData[id];
      }

      fetchExtendedCourse(id)
        .then(c => setExtendedData({ ...extendedData, [id]: c }))
        .catch(e => {
          console.error(e);
          setExtendedData({ ...extendedData, [id]: { error: e.message } });
        });

      return { loading: true };
    },

    // Planner
    getPlannerStartYear: () => appData.planner_start_year,
    setPlannerStartYear: year => {
      setAppData({ ...appData, planner_start_year: year })
      ReactGA.event({ category: 'Planner', action: 'Set year', label: year.toString() });
      persistUpdate({ field: 'planner_start_year', op: '$set', value: year });
    },
    getPlannerCoursesForTerm: (termId) => {
      const data = appData.planner[termId] || [];
      let courses = data.map(c => courseCache[c] ? { ...courseCache[c], starred: false } : undefined);

      if (appData.planner_settings.show_starred) {
        const starred = appData.classes.map(c => cache[c]).filter(c => c && c.termId === termId).map(c => c.objectID);
        for (let objectID of starred) {
          let i = courses.findIndex(c => c && c.objectID === objectID);
          if (i === -1) {
            courses.push({ ...courseCache[objectID], starred: true });
          } else {
            courses[i] = { ...courses[i], starred: true };
          }
        }
      }

      return courses.filter(c => !!c);
    },
    addPlannerCourse: (termId, c) => {
      let { planner } = appData;
      courseCache[c.objectID] = c;
      if (!planner[termId]) { planner[termId] = []; }
      planner[termId].push(c.objectID);
      setAppData({ ...appData, planner });
      persistUpdate({ field: `planner.${termId}`, op: '$set', value: planner[termId] });
      ReactGA.event({ category: 'Planner', action: 'Add course', label: c.number });
    },
    removePlannerCourse: (termId, courseId) => {
      let { planner } = appData;
      planner[termId] = planner[termId].filter(c => c !== courseId);
      setAppData({ ...appData, planner });
      persistUpdate({ field: `planner.${termId}`, op: '$set', value: planner[termId] });
      ReactGA.event({ category: 'Planner', action: 'Remove course', label: (courseCache[courseId] || {}).number });
    },
    movePlannerCourse: ({ startTermId, startIndex, destinationTermId, destinationIndex, courseId }) => {
      let { planner } = appData;

      if (!planner[startTermId]) { planner[startTermId] = []; }
      planner[startTermId] = planner[startTermId].filter(c => c !== courseId);

      if (!planner[destinationTermId]) { planner[destinationTermId] = []; }
      planner[destinationTermId].splice(destinationIndex, 0, courseId);

      setAppData({ ...appData, planner });

      if (startTermId !== destinationTermId) {
        persistUpdate({ field: `planner.${startTermId}`, op: '$set', value: planner[startTermId] });
      }
      persistUpdate({ field: `planner.${destinationTermId}`, op: '$set', value: planner[destinationTermId] });
    },
    plannerHasCourse: (courseId) => {
      return Object.values(appData.planner).some(p => p.indexOf(courseId) !== -1);
    },
    plannerTermHasCourse: (termId, courseId) => {
      return appData.planner[termId] && appData.planner[termId].indexOf(courseId) !== -1;
    },

    getPlannerSettings: () => {
      return appData.planner_settings;
    },
    setPlannerSettings: (updated) => {
      const newSettings = { ...appData.planner_settings, ...updated };
      setAppData({ ...appData, planner_settings: newSettings });
      persistUpdate({ field: `planner_settings`, op: '$set', value: newSettings });
    }
  };

  return generated;
};
