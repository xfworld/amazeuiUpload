$(function(){


	 $('#event').Upload({
       url : 'http://localhost/demo.json',
       downloadUrl :'',
       maxfiles: 10 , // 单次上传的数量
       maxfilesize : 20,  // 单个文件允许的大小 (M)
       multithreading : false, // true为同时上传false为队列上传
       useDefTemplate :true // 开启默认模版
    });


  	$('#callBack').on("click",function(){
        var arr=$('#event').Upload('selectResult');
        console.log(arr);
        $('#fileResult').html(arr);
  	});


});
