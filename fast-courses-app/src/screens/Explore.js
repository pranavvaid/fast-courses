import React, { useState, useCallback } from 'react';
import Modal from 'react-modal';
import Iframe from 'react-iframe';

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
      <Iframe
        url="https://pranavvaid.github.io/cardinalgraph/"
        width="1200px"
        height="550px"
        id="myId"
        className="myClassname"
        display="initial"
        position="relative"
        allowFullScreen
      />
    </Modal>
  );
};
