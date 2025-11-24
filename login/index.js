function validateFields() {
    const emailIsValid = isEmailValid();
    const passwordIsValid = isPasswordValid();

    // Habilita/desabilita o botão de entrar
    const btn = document.getElementById('loginButton');
    btn.disabled = !(emailIsValid && passwordIsValid);
}

function isEmailValid() {
    const email = document.getElementById('email').value;
    if (!email) {
        return false;
    }
    return validateEmail(email);
}

function isPasswordValid() {
    const password = document.getElementById('password').value;
    if (!password) {
        return false;
    }
    return true;
}

function validateEmail(email) {
    return /\S+@\S+\.\S+/.test(email);
}

function login() {
    if (!isEmailValid() || !isPasswordValid()) {
        validateFields();
        return;
    }
    window.location.href = "../home/home.html";
}

    function irParaCadastro() {
    window.location.href = "/cadastro/cadastro.html";
}

// garante que o botão chame a função
document.addEventListener('DOMContentLoaded', function() {
  const cad = document.getElementById('cadButton');
  if (cad) {
    cad.addEventListener('click', irParaCadastro);
  }
});


