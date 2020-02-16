import React from 'react'
import { connectRefinementList } from 'react-instantsearch-dom';

const Courses = ({ courses }) => (
  <div class="ais-RefinementList">
    <ul class="ais-RefinementList-list">
        {courses.map(course => (
          <li class="ais-RefinmentList-item">
            <label class="ais-RefinementList-label">
              <input class="ais-RefinementList-checkbox" type="checkbox" />
              <span class="ais-RefinementList-labelText">{course.number}</span>
            </label>
          </li>
        ))}
    </ul>
  </div>
)

function setRefine(courses, refine) {
  return function() {
    let parent = document.getElementById("classList");
    let to_enable = [];
    if(parent) {
      for (let i = 0; i < parent.children.length; i++) {
        if (parent.children[i].children[0].children[0].checked) {
          to_enable = to_enable.concat(courses[i].reqs);
        }
      };
    }
    refine(to_enable);
  }
}
const RefinementList = ({
  items,
  isFromSearch,
  refine,
  searchForItems,
  createURL,
  courses
}) => (
  <div class="ais-RefinementList">
    <ul class="ais-RefinementList-list" id="classList" onChange={setRefine(courses, refine)}>
        {courses.map(course => (
          <li class="ais-RefinmentList-item">
            <label class="ais-RefinementList-label">
              <input class="ais-RefinementList-checkbox" type="checkbox"  />
              <span class="ais-RefinementList-labelText">{course.number}</span>
            </label>
          </li>
        ))}
    </ul>
  </div>
);

const CustomRefinementList = connectRefinementList(RefinementList);

export default CustomRefinementList;

/*
    {items.map(item => (
      <li key={item.label}>
        <a
          href={createURL(item.value)}
          style={{ fontWeight: item.isRefined ? 'bold' : '' }}
          onClick={event => {
            event.preventDefault();
            refine(item.value);
          }}
        >
          {isFromSearch ? (
            <Highlight attribute="label" hit={item} />
          ) : (
            item.label
          )}{' '}
          ({item.count})
        </a>
      </li>
    ))}
    */
