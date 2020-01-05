$(document).ready(function(){



				 $('#picform').submit(function (e) {
		 	
           e.preventDefault();
           var fd = new FormData(this);

         $.ajax({
                url: '/profilepic/',
              data: fd,
                processData: false,
                contentType: false,
                type: 'POST',
                success: function(data){
           if (String(data) == String("no"))
           	$('#errorM').html('You reached the maximum number of pictures in you gallery wich is 5 including your profile picture ');
           else  if (String(data) == String("unsupported"))
            $('#errorM').html('unsupported file');
          else
              	$('#afterpost').html(data);
              
                }
           });
      });

				 	});