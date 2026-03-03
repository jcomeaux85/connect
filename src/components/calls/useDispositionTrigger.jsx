export const triggerDispositionForm = ({ caseId, customerName, customerPhone }) => {
  window.dispatchEvent(new CustomEvent('show-disposition-form', {
    detail: { caseId, customerName, customerPhone }
  }));
};