import React, { useState, useCallback, Button } from 'react';
import Modal from 'react-modal';
import Iframe from 'react-iframe';
import { fetchPrereqsOf } from '../store'

export default ({ history, store, ...props }) => {
  if (props.match && props.match.params.courseId) {
    fetchPrereqsOf(props.match.params.courseId).then(function(result) {
      let ul = document.getElementById("prereq_elems");
      if (ul) {
        ul.innerHTML = "";
        result.sort().forEach(function(course) {
          let li = document.createElement("li");
          let a = document.createElement("a");
          a.href = "/courses/"+course;
          a.textContent = course;
          li.appendChild(a);
          ul.appendChild(li);
        });
      }
    });
  }
  return (
    <Modal
      isOpen={true}
      className="modal__modal"
      overlayClassName="modal__overlay"
      onRequestClose={() => history.push('/')}
    >
      <div>
        <h1>Prereqs</h1>
          <ul id="prereq_elems">
            <span>Loading...</span>
          </ul>
      </div>
    </Modal>
  );
};
