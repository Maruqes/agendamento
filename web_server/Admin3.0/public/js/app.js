//Botão de fullscreen
function toggleFullscreen() {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen();
  } else {
    if (document.exitFullscreen) {
      document.exitFullscreen(); 
    }
  }
}

//Validação de formulário do Bootstrap
(() => {
  'use strict'

  // Fetch all the forms we want to apply custom Bootstrap validation styles to
  const forms = document.querySelectorAll('.needs-validation')

  // Loop over them and prevent submission
  Array.from(forms).forEach(form => {
    form.addEventListener('submit', event => {
      if (!form.checkValidity()) {
        event.preventDefault()
        event.stopPropagation()
      }

      form.classList.add('was-validated')
    }, false)
  })
})()


document.addEventListener('DOMContentLoaded', (event) => {
  //Preenche os campos do modal editar
  document.getElementById('colab-table').addEventListener('click', function(event) {
    var user = event.target.closest('a').getAttribute('data-user');
    if (event.target.closest('a[data-bs-target="#modal_edit"]')) {
      var full_name = event.target.closest('a').getAttribute('data-nomeCompleto');
      var email = event.target.closest('a').getAttribute('data-email');
      var telefone = event.target.closest('a').getAttribute('data-telefone');
      document.getElementById('username_edit').value = user;
      document.getElementById('nomeCompleto_edit').value = full_name;
      document.getElementById('email_edit').value = email;
      document.getElementById('telefone_edit').value = telefone;  
      //Preenche o user no modal delete
    } else if (event.target.closest('a[data-bs-target="#modal_delete"]')) {
      document.getElementById('userToDelete').textContent = user;
      userToDelete = user;
    }
  });
  
});

// Notificação
  mensagem = localStorage.getItem('notificationMessage');
  tipo = localStorage.getItem('notificationType');
  // Verifique se a notificação deve ser mostrada
  if (localStorage.getItem('showNotification') === 'true') {
    // mostra a notificação
    $.notify(mensagem, { position: "top center", className: tipo, autoHideDelay: 3000, showAnimation: "slideDown", hideAnimation: "slideUp" });
    // Remova a variável
    localStorage.removeItem('showNotification');
    localStorage.removeItem('notificationMessage');
    localStorage.removeItem('notificationType');
  }
