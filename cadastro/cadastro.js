    const form = document.getElementById('registerForm');
    const errorDiv = document.getElementById('error');

    form.addEventListener('submit', function(e) {
      e.preventDefault();

      const password = form.password.value;
      const confirmPassword = form.confirm_password.value;

      if (password !== confirmPassword) {
        errorDiv.textContent = "As senhas não conferem!";
        return;
      }

      // enviar os dados para o backend
      alert('Cadastro válido! (apenas front-end neste momento)');
      form.reset();
      errorDiv.textContent = '';
    });
  
