var getProjects = function() {
  $.get('https://api.github.com/user/repos', {
    access_token: 'bdd9a197fae27d91ec86e80a15bc50324eee6fe5'
  }, function(data) {
    console.log(data);
  });
}
