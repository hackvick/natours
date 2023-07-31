const login = async (email, password) => {
  console.log(email, password);
  try {
    const res = await axios({
      method: 'POST',
      url: 'http://127.0.0.1:3000/api/v1/users/login',
      data: {
        email,
        password
      }
    });
  } catch (error) {
    console.log(error);
  }
};

document.querySelector('form').addEventListener('submit', e => {
  e.preventDefault();
  console.log('fd');
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  login(email, password);
});
