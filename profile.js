document.addEventListener('DOMContentLoaded', function() {
    const editButton = document.querySelector('.edit-button');
    const editForm = document.querySelector('.edit-form');
    const cancelButton = document.querySelector('.cancel-button');

    editButton.addEventListener('click', function() {
        editForm.classList.toggle('hidden');
    });

    cancelButton.addEventListener('click', function() {
        editForm.classList.add('hidden');
    });
});
