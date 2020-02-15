import React, { useState, useCallback } from 'react';
import Modal from 'react-modal';

export default ({ history, store }) => {
  return (
    <Modal
      isOpen={true}
      className="modal__modal"
      overlayClassName="modal__overlay"
      onRequestClose={() => history.push('/')}
    >
      <h1>Explore <em>alpha</em></h1>
    </Modal>
  );
};
