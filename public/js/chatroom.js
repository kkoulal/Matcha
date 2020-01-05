var query = window.location.search.substring(1);
		var vars = query.split("&");
		var pair = vars[0].split("=");
		var token = pair[1];
		var id = $('#userid').val();
		var to = (token/id)*2;
		to = Math.round(to);

$(document).ready(function(){
	function scrollChar()
	{
		$('#chat').animate({
		scrollTop: $('#chat').get(0).scrollHeight}, 1000);  
		var screenWidth = $(window).height();
		$('#chat').css('height', 200 + 'px');
	}
	scrollChar();
	document.getElementById('to').value = to;
	$('#messageForm').submit(function (e) 
	{
		e.preventDefault();
		var fd = new FormData(this);
		$.ajax({
				url: '/chatroom/',
				data: fd,
				processData: false,
				contentType: false,
				type: 'POST',
				success: function(data){}
		});
			var fewSeconds = 1;
		$('#message').val('');
		var btn = $('#send');
   		btn.prop('disabled', true);
   		setTimeout(function()
   		{
       		btn.prop('disabled', false);
   		}, fewSeconds*1000);
	});

	function escapeHtml(text) 
	{
		var map = 
		{
			'&': '&amp;',
			'<': '&lt;',
			'>': '&gt;',
			'"': '&quot;',
			"'": '&#039;'
		};
		return text.replace(/[&<>"']/g, function(m) { return map[m]; });
	}
	var socket = io.connect();
	$('#send').click(function()
	{
		scrollChar();
		var msg = $('#message').val();
		if (msg != '' && msg.length < 100 && (msg.indexOf('<script>') <= -1) && msg.length != 0)
		{
				msg = msg.replace(":)", "&#128512");
				msg = msg.replace("xD", "&#x1F606");
				msg = msg.replace("=)", "&#x1F601");
				msg = msg.replace("8)", "&#x1F60E");
				msg = msg.replace(":(", "&#x1F615");
				msg = msg.replace(":@", "&#x1F621");
				msg = msg.replace("<3", "&#x2764");
			socket.emit('send message', msg, token, to);
		}
		socket.emit('notif message', to);
	});
	socket.on('room'+token, function(data)
	{
		scrollChar();
		if (id != data.id && data.id == to)
		$('#chat').append('<div class="from-me" style="font-weight: bold;text-align:center;color:#fff;margin-right:50%;word-wrap:break-word;">' + data.msg + '</div>');
		else if (id == data.id && data.id != to)
		$('#chat').append('<div class="from-them" style="font-weight: bold;text-align:center;color:#000;margin-left:50%;word-wrap:break-word;">' + data.msg + '</div>');
	});
	socket.on('notif', function(data)
	{
		if (id == data.id)
		{
			$('#off').remove('anime');
			$('#off').addClass('anime');
			$('#off').attr('onclick', 'location.href="/notif"')
		}
	});
});


