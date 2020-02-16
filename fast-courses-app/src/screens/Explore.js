import React, { useState, useCallback, Button } from 'react';
import Modal from 'react-modal';
import Iframe from 'react-iframe';

function full() {
  document.getElementById('map_frame').requestFullscreen();
}

export default ({ history, store }) => {
  return (
    <Modal
      isOpen={true}
      className="modal__modal"
      overlayClassName="modal__overlay"
      onRequestClose={() => history.push('/')}
    >
      <h1>
        Explore <em>alpha</em>
      </h1>
      <div>
        <Iframe
          url="https://pranavvaid.github.io/cardinalgraph/"
          width="100%"
          height="650"
          id="map_frame"
          className="mapFrame"
          display="initial"
          position="relative"
          allowFullScreen
          scrolling="yes"
        />
      </div>

      <button onClick={full} class="ais-ClearRefinements-button">
        Full Screen!
      </button>
    </Modal>
  );
};
