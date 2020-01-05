var socket = io.connect();
	var id = $('#userid').val();
	socket.on('notif', function(data){
		if (id == data.id)
		{
		$('#off').remove('anime');
		$('#off').addClass('anime');
		$('#off').attr('onclick', 'location.href="/notif"')}
	});
	socket.on('msg', function(data){
		if (id == data.id)
		{
		$('#msg').remove('message');
		$('#msg').addClass('message');
		$('#msg').attr('onclick', 'location.href="/message"')}
	});