/**
 * Author : xfworld
 * Email : xf.key@163.com
 * Version : 0.1
 * Licensed under the MIT license:
 * 	http://www.opensource.org/licenses/mit-license.php
 * 	Project home:
 * 	https://github.com/xfworld/AmazeUI Upload
 */
!(function($) {
	var opts = {};
	var defaultOpts = {
			url : '', // 后台接受地址
			maxfiles : 2, // 最大上传文件数
			maxfilesize : 2, // 最大的文件大小
			dynamic : function(complete, speed) {},
			error : function(error,file,i) { alert(error) }, // 异常信息接收
			multithreading : true, // 是否同时上传
			type : [], // 限制上传的类型
			dragenter : function(e) { return false; },
			dragleave : function(e) { return false; },
			dragover : function(e) { return false; },
			drop : function(e) { return false; },
			dropDefa : function(e) { return false; },
			enterDefa : function(e) { return false; },
			leaveDefa : function(e) { return false; },
			overDefa : function(e) { return false; },
			useDefTemplate: true, //是否启用默认模版
			tpl : function() { return 'false'; },
			setImageTpl : function(file, image, img) {},
			setOtherTpl : function(file) {},
			complete : function(file) {},
			fileStore: function(e){},
			fileCallback:[],
			stageChange : function(file) {}, // 当开启队列上传时可以知道那个文件正在被上传
			Knowntype : {'pdf':'./image/pdf.jpg', 'html':'./image/html.png'},
			selectMultiple : true // 允许选择多个文件
		};
	var errorTexts = ["浏览器不支持", "超过最大文件数", "文件大小超过限制", "不允许的上传格式"];
	var errorCode = {200 : 'warning', 201 : 'deadly'}; // warning 普通错误 deadly 致命错误
	var uploadImg = [];
	var uploadTotal = 0; // 本次操作被放入的文件数
	var fileIndex = 0; // 记录总共拖入的文件数
	var thisFile = 0; // 存放当前文件的资源对象
	var startTime = 0; // 当前文件的上传开始时间
	var queue = []; // 用于队列上传
	var loadOk = 0; // 用于记录当前操作放入的文件被加载成功的数目
	var time = []; // 用于计算每个文件上传的平均网速
	var context=''; //对象上下文

	/**
		* 公共接口，注册所有的可调用的方法
		*/
	 var methods = {
					 init: function(options) {
						 _init(options);
					 },
					 selectResult:function(){
						 	return _selectResult();
					 }
			 };

		 /**
		* 定义领域的方法初始化
		*/
 $.fn.Upload = function(){
	  context=this;
	 var method = arguments[0];
        if(methods[method]) {
            method = methods[method];
            arguments = Array.prototype.slice.call(arguments, 1);
        } else if( typeof(method) == 'object' || !method ) {
            method = methods.init;
        } else {
            $.error( 'Method ' +  method + ' does not exist on jQuery.host' );
            return this;
        }
        return method.apply(this, arguments);

 	};

	function _init(userOpts){
		context.html(_initFileContext());
		opts = $.extend( {}, defaultOpts , userOpts);
		_initFileHandEvent();
		_pasteFile();
		_dropFile();
		_selectFile();
	};

	// 拖拽上传
 function _dropFile() {
		$.event.props.push("dataTransfer");
		context.bind('dragenter', dragenter).bind('dragleave', dragleave).bind('dragover', dragover).bind('drop', drop);
		$(document).bind('drop', dropDefa).bind('dragover', overDefa).bind('dragleave', leaveDefa).bind('dragenter', enterDefa);
	}
	// 粘贴上传
function _pasteFile() {
		$.event.props.push("clipboardData");
		var _this = context;
		context.bind('mouseover', function() { _this.bind('paste', pasteHand); });
		context.bind('mouseout', function() { _this.unbind('paste', pasteHand); });

	}
	// 选择上传
 function _selectFile() {
		var selectFile=$('#selectFile');
		if(selectFile.attr('multiple') == undefined && opts.selectMultiple) {
			selectFile.attr('multiple', 'multiple');
		}
		selectFile.bind('change', function() {
			_handFiles(this.files)
		})
	}

	// 返回上传成功的文件标识
	 function _selectResult(){
		 var uList;
		 if(opts.useDefTemplate){
			 uList=$('#_template tbody tr.selectDelete');
		 }else{
			 uList=$('#_uList li.selectDelete');
		 }
		 uList.find('span.fileID').each(function(index,object){
			 var value=object.textContent;
			 _remove(opts.fileCallback,value);
		 });

		return opts.fileCallback;
	};

	//注册文件处理事件
	function _initFileHandEvent(){
		 if(opts.useDefTemplate){
			 _setDefaultTemplate();
		 }
		 opts.complete=_defaultComplete;
		 opts.dynamic=_defaultDynamic;
		 opts.stageChange=_defaultStageChange;
		 opts.tpl=_setDefaultOtherTemplate;
		 opts.setImageTpl=_setDefaultImageTpl;
		 opts.setOtherTpl=_setDefaultOtherTpl;
	};

	/**
	 * 初始化组件上下文
	 * @return {[html]} [组件上下文]
	 */
	function _initFileContext(){
			var context='<div class="am-form-group am-form-file am-upload-toggleBoarder">\
				<button type="button" class="am-btn am-btn-primary am-btn-xs">\
					 <i class="am-icon-cloud-upload"></i>选择要上传的文件\
				</button>\
				<input id="selectFile" type="file" multiple />\
				<div class="am-upload-parse">把文件拖这里试试</div>\
			</div>\
			<ul width="100%" class="am-avg-sm-1 am-avg-md-3 am-avg-lg-6 am-thumbnails" id="_uList"></ul>\
			<table class="am-table am-table-compact am-table-striped am-table-hover am-text-sm" id="_template"></table>';

			return context;
	};

	function pasteHand(e) {
    	var clipboard = e.clipboardData;
    	var temp = [];
    	for (var i = 0; i < clipboard.items.length; i++) {
    		temp.push(clipboard.items[i].getAsFile());
    	};
    	_handFiles(temp);
		e.preventDefault();
		e.stopPropagation();

	}
	function dragenter(e) {
		e.dataTransfer.dropEffect = "copy";
		e.preventDefault();
		e.stopPropagation();

	}
	function dragleave(e) {
		e.dataTransfer.dropEffect = "copy";
		e.preventDefault();
		e.stopPropagation();

	}
	function dragover(e) {
		e.dataTransfer.dropEffect = "copy";
		e.preventDefault();
		e.stopPropagation();

	}
	function drop(e) {
		_handFiles(e.dataTransfer.files);
		e.dataTransfer.dropEffect = "copy";
		e.preventDefault();
		e.stopPropagation();
	}
	function dropDefa(e) {
		opts.dropDefa(e);
		e.dataTransfer.dropEffect = "none";
		e.preventDefault();
		e.stopPropagation();
	}
	function enterDefa(e) {
		opts.enterDefa(e);
		e.dataTransfer.dropEffect = "none";
		e.preventDefault();
		e.stopPropagation();
	}
	function leaveDefa(e) {
		opts.leaveDefa(e);
		e.dataTransfer.dropEffect = "none";
		e.preventDefault();
		e.stopPropagation();
	}
	function overDefa(e) {
		opts.overDefa(e);
		e.dataTransfer.dropEffect = "none";
		e.preventDefault();
		e.stopPropagation();
	}

	//计算文件上传进度
	function progress(e, file) {
		if(e.lengthComputable) {
			//计算网速
			var nowDate = new Date().getTime();
			var x = (e.loaded) / 1024;
			var y = (nowDate - startTime) / 1000;
			time.push((x / y).toFixed(2));
			if((e.loaded / e.total) * 100 == 100) {
				var avg = 0;
				for (var i = 0; i < time.length; i++) {
					avg += parseInt(time[i]);
				};
				// 求出平均网速
			}
			var result = {};

			result.thisDom = _dynamicTemplate(file);
			result.progress = Math.round((e.loaded / e.total) * 100);
			result.speed = (x / y).toFixed(2);
			result.loaded = getFileSize({size : e.loaded});
			result.total = getFileSize({size : e.total});
			opts.dynamic(result);
		} else {
			alert('无法获得文件大小')
		}
	}

	function getFileSize(file) {
		var filesize = file.size;
	    if (filesize >= 1073741824) {
	        filesize = Math.round(filesize / 1073741824 * 100) / 100 + ' GB';
	    } else if (filesize >= 1048576) {
	        filesize = Math.round(filesize / 1048576 * 100) / 100 + ' MB';
	    } else if(filesize >= 1024) {
	        filesize = Math.round(filesize / 1024 * 100) / 100 +  ' KB';
	    } else {
	        filesize = filesize + ' Bytes';
	    }
	    return filesize;
	}
	function _setDefaultTpl(file){
		var data = {};
		data.file = file;
		data.fileSize = getFileSize(file);
		data.fileType = getFileType(file);
		_createRow(data);

		loadOk++;
		if(loadOk == queue.length && !opts.multithreading) {
			_upload(queue[0]);
		}
		if(opts.multithreading) {
			_upload(file);
		}
	}
	function _setImageTpl(file, fileReaderiImage, newImage) {
		var data = {};
		data.file = file;
		data.fileReaderiImage = fileReaderiImage;
		data.newImage = newImage;
		data.fileSize = getFileSize(file);
		data.fileType = getFileType(file);
		opts.setImageTpl(data);
		loadOk++;
		if(loadOk == queue.length && !opts.multithreading) {
			_upload(queue[0]);
		}
		if(opts.multithreading) {
			_upload(data.file);
		}
	}
	function setOtherTpl(file) {
		var data = {};
		data.file = file;
		data.fileSize = getFileSize(file);
		data.fileType = getFileType(file);
		opts.setOtherTpl(data);

		var type = getFileType(file);
		if(opts.Knowntype[type] != undefined && opts.Knowntype[type] != 'undefined') {
			var thisLi = $('#_uList li').eq(data.file.index);

			thisLi.find('.image img').attr('src', opts.Knowntype[type]);

		}
		loadOk++;
		if(loadOk == queue.length && !opts.multithreading) {
			_upload(queue[0]);
		}
		if(opts.multithreading) {
			_upload(file);
		}
	}
	function getImageInfo(file, image) {
		var img = new Image();
		img.src = image.target.result;
		img.addEventListener('load', function(e) {
			_setImageTpl(file, image, img);
		}, false);
	}
	function _readerFile(file) {
		var reader = new FileReader();
		reader.addEventListener('load', function(e) {
			_switchHand(file, e);
		}, false);
		reader.readAsDataURL(file);
	}
	function filter(file) {
		var type = !file.type ? 'other' : file.type.split('/')[1];
		if(type) {
			var typeIsOk = false;
			if(opts.type.length > 0) {
				for(o in opts.type) {
					if(type == opts.type[o] ) { typeIsOk = true; break;}
				}
				if(!typeIsOk) {
					opts.error(errorTexts[3], file);
					return errorCode['200'];
				}
			}

		}
		if(uploadTotal > opts.maxfiles) {
			opts.error(errorTexts[1], file);
			return errorCode['201'];
		}
		var max_file_size = 1048576 * opts.maxfilesize;
		if(file.size > max_file_size) {
			opts.error(errorTexts[2], file);
			return errorCode['200'];
		}


	}


	function createXMLHttpRequest() {
		if(window.XMLHttpRequest){
			return new XMLHttpRequest();
		} else {
			var names=["msxml","msxml2","msxml3","Microsoft"];
			for(var i=0;i<names.length;i++){
				try{
					var name=names[i]+".XMLHTTP";
					return new ActiveXObject(name);
				}catch(e){
				}
			}
		}
		return null;
	}

	//切换文件处理方式
	function _switchHand(file, e) {
		if(opts.useDefTemplate){
			_setDefaultTpl(file);
		}else{
			var type = !file.type ? 'other' : file.type.split('/')[1];
			if(type == 'jpeg' || type == 'png' || type == 'gif' || type == 'bmp' || type == 'x-icon') {
				getImageInfo(file, e);
				return;
			}
			setOtherTpl(file);
		}
	}

	//上传文件
	function _upload(file) {
		file.stage = 'uploadIng';
		opts.stageChange(file);

		var xhr = createXMLHttpRequest();
		xhr.open('POST', opts.url, true);
		var upload = xhr.upload;
		if(upload) {
			upload.addEventListener('progress', function(e) {
				progress(e, file);
			}, false);
		}
		xhr.addEventListener('readystatechange', function() {
			if(xhr.readyState == 4 && xhr.status == 200) {
				if(!opts.multithreading) {
					if(queue.length > 1) {
						queue.shift();
						loadOk--;
						upload_(queue[0]);
					}
				}
				file.responseText = xhr.responseText;
				opts.complete(file);
			}
		}, false);
		var formData = new FormData();
		formData.append('file', file);
		xhr.send(formData);
		startTime = new Date().getTime();
	}

	//上传文件内部方法
	function upload_(file) {
		_upload(file);
	}

	//处理文件
	function _handFiles(files) {
		files = sortFiles(files);
		uploadTotal = files.length;
		Array.prototype.push.apply(queue, files);
		for (var i = 0; i < files.length; i++) {
			var code = filter(files[i]);
			if(code == 'deadly') {
				return false;
			} else if(code == 'warning') {
				continue;
			}
			if(files[i].name == undefined) { files[i].name = new Date().getTime(); }
			files[i].index = fileIndex++;
			files[i].stage = 'Waiting';
			_readerFile(files[i]);
			thisFile = files[i];
		};
	}

	//文件排序
	function sortFiles(files) {
		var listSize = [];
		for (var i = 0; i < files.length; i++) {
			listSize[i] = files[i];
		};
		for (var i = 0; i < listSize.length; i++) {
			for (var j = i+1; j < listSize.length; j++) {
				if(listSize[j].size < listSize[i].size) {
					var temp = listSize[j];
					listSize[j] = listSize[i];
					listSize[i] = temp;
				}
			};
		};

		return listSize;
	}

	//获取文件类型
	function getFileType(file) {
		var type = !file.type ? 'other' : file.type.split('/')[1];
		return type;
	}
	// 上传状态改变时触发
	function _defaultStageChange(file) {
		var uList=_dynamicTemplate(file);
		uList.find('.am-progress').show();
		uList.find('.stage span').html('上传中');
		// console.log(file.index + '正在被上传');
	}

	// 当开启队列上传时可以知道那个文件正在被上传,返回网速及上传百分比
	function _defaultDynamic(result) {
		result.thisDom.find('.am-progress-bar.am-progress-bar-secondary').css('width', result.progress + '%').html(result.progress + '%');
		result.thisDom.find('.speed text').text(result.speed + " K\/S")
		result.thisDom.find('.loaded text').text(result.loaded + ' / ' + result.total)

	}

	// 上传完成后调用的
	function _defaultComplete(file) {
		var result=_defaultCompleteAsync(file.responseText);
		if(result!=null&&result!=undefined){
				_defaultCompleteStatus(file,result.status,result.data.id);
		}else{
				_defaultCompleteStatus(file,false,"");
		}
	}

	//上传完成后异步记录
	function _defaultCompleteAsync(callback){
		var dataObj=null;
		if(callback!=null&&callback!=undefined){
			try{
				dataObj = eval('(' +callback+ ')')
			}catch(e){
				console.log(e);
			}
			//传递成功，主要标识写入文件集合
			if(dataObj!=null&&dataObj.status){
					opts.fileCallback.push(dataObj.data.id);
			}
		}
		return dataObj;
	}

	//上传完成后，改变上传状态
	function _defaultCompleteStatus(file,status,fileid){
		var uList = _dynamicTemplate(file);
		if(status){
			uList.find('.stage span').removeClass('am-badge-warning').addClass('am-badge-success').html('上传成功');
			uList.find('.fileID').html(fileid);
		}else{
			uList.find('.stage span').removeClass('am-badge-warning').addClass('am-badge-danger').html('上传失败');
		}
		_defaultCompleteDeleteFileEvent(uList);
	//	uList.find('.am-progress.am-progress-striped.am-active').hide();
	}
	/**
	 * 绑定上传行按钮事件
	 * 移除行及传递成功后的文件索引
	 * @param  {[type]} tr   行信息
	 */
	function _defaultCompleteDeleteFileEvent(tr){
		if(tr!=null&&tr!=undefined){
				tr.find('.am-btn').on('click',function(){
						$(tr).addClass("selectDelete").hide();
				}).show();
		};
	};
	//获取模版定义
	function _dynamicTemplate(file){
		var uList;
		if(opts.useDefTemplate){
			uList=$('#_template tbody tr').eq(file.index);
		}else{
			uList=$('#_uList li').eq(file.index);
		}
		return uList;
	}
	//设定默认模版
	function _setDefaultTemplate(){
		var th='<thead><tr><th>文件信息</th><th>上传情况</th><th>上传状态</th><th>操作项</th></tr></thead><tbody></tbody>';
		$('#_template').append(th);
	}
	//设定默认模版行
	function _getRowTemplate(){
		var rowTemplate='<tr>\
		  <td width="40%">\
				<span style="display:none" class="fileID"></span>\
				<span class="fileName"><label class="am-text-xs"><text>-</text><label></span><br/>\
				<span class="fileSize"><span class="am-badge">文件大小<text>-</text></span></span>\
			</td>\
			<td width="20%">\
			  <span class="speed"><span class="am-badge am-badge-primary">速度<text>-</text></span></span><br />\
				<span class="loaded"><span class="am-badge am-badge-secondary">详情<text>-</text></span></span>\
			</td>\
			<td width="30%">\
			<div class="stage"><span class="am-badge am-badge-warning">初始化</span></div>\
			<div class="am-progress am-progress-striped am-active" style="display:none">\
				<div class="am-progress-bar am-progress-bar-secondary"  style="width: 10%;" >10%</div>\
			</div>\
			</td>\
			<td width="10%" class="am-text-middle"><button type="button" class="am-btn am-btn-danger am-round am-btn-xs"><i class="am-icon-remove"></i>移除</button></td>\
		</tr>';
		return rowTemplate;
	}
	//创建默认模版行记录
	function _createRow(data){
		var tpl=_getRowTemplate();
		$('#_template tbody').append(tpl);
		var thisLi = $('#_template tbody tr').eq(data.file.index);
		thisLi.find('.fileName text').text(data.file.name);
		thisLi.find('.fileSize text').text(data.fileSize);
		thisLi.find('am-btn').hide();
	};
	// 自定义模板
	function _setDefaultOtherTemplate(type){
			var imageTpl = '<li>\
				<div class="image">\
					<img class="am-thumbnail" src="" alt="">\
				</div>\
				<div class="uploadInfo">\
					<table class="am-table am-table-compact am-table-striped am-table-hover am-text-xs">\
					<tr><td class="am-text-break"><span style="display:none" class="fileID"></span><span class="fileName"><text>-</text></span></td></tr>\
					<tr><td><span class="imageSize">图片尺寸&nbsp;&nbsp;<text>-</text></span></td></tr>\
					<tr><td><span class="fileSize"><span class="am-badge">文件大小<text>-</text></span></span></td></tr>\
					<tr><td><span class="fileType"><span class="am-badge">文件类型<text>-</text></span></span></td></tr>\
					<tr><td><span class="speed"><span class="am-badge am-badge-primary">上传速度<text>-</text></span></span></td></tr>\
					<tr><td><span class="loaded"><span class="am-badge am-badge-secondary">上传详情<text>-</text></span></span></td></tr>\
					<tr><td><div class="stage"><span class="am-badge am-badge-warning">初始化</span></div></td></tr>\
					<tr>\
						<td><div class="am-progress am-progress-striped am-active" style="display:none">\
							<div class="am-progress-bar am-progress-bar-secondary"  style="width: 40%;" >40%</div></div>\
						</td>\
					</tr>\
					<tr><td class="am-text-middle"><button type="button" class="am-btn am-btn-danger am-round am-btn-xs"><i class="am-icon-remove"></i>移除</button></td></tr>\
					</table>\
				</div>\
			</li>';
			var otherTpl = '<li>\
				<div class="uploadInfo">\
					<table class="am-table am-table-compact am-table-striped am-table-hover am-text-xs">\
						<tr><td class="am-text-break"><span style="display:none" class="fileID"></span><span class="fileName"><text>-</text></span></td></tr>\
						<tr><td><span class="fileSize"><span class="am-badge">文件大小<text>-</text></span></span></td></tr>\
						<tr><td class="am-text-break"><span class="fileType">文件类型<text>-</text></span></td></tr>\
						<tr><td><span class="speed"><span class="am-badge am-badge-primary">上传速度<text>-</text></span></span></td></tr>\
						<tr><td><span class="loaded"><span class="am-badge am-badge-secondary">上传详情<text>-</text></span></span></td></tr>\
						<tr><td><div class="stage"><span class="am-badge am-badge-warning">初始化</span></div></td></tr>\
						<tr>\
							<td><div class="am-progress am-progress-striped am-active" style="display:none">\
								<div class="am-progress-bar am-progress-bar-secondary"  style="width: 40%;" >40%</div></div>\
							</td>\
						</tr>\
						<tr class="am-text-middle"><td><button type="button" class="am-btn am-btn-danger am-round am-btn-xs"><i class="am-icon-remove"></i>移除</button></td></tr>\
					</table>\
				</div>\
			</li>';
			if(type == 'image') {
				return imageTpl;
			} else if(type == 'other') {
				return otherTpl;
			}
	};

	// 设置图片类型文件View模板
	 function _setDefaultImageTpl(data) {
		var tpl = opts.tpl('image', 1);
		$('#_uList').append(tpl);
		var thisLi = $('#_uList li').eq(data.file.index);
		thisLi.find('.image img').attr('src', data.fileReaderiImage.target.result).each(function(){
			if($(this).width() > $(this).parent().width()) {
				$(this).width("100%");
			}
		});
		thisLi.find('.fileName text').text(data.file.name);
		thisLi.find('.imageSize text').text(data.newImage.width + ' X ' + data.newImage.height);
		thisLi.find('.fileSize text').text(data.fileSize);
		thisLi.find('.fileType text').text(data.fileType);

	};
	// 设置其他文件类型View模板
	function _setDefaultOtherTpl(data) {
		var tpl = opts.tpl('other', 1);
		$('#_uList').append(tpl);
		var thisLi = $('#_uList li').eq(data.file.index);
		thisLi.find('.fileName text').text(data.file.name);
		thisLi.find('.fileSize text').text(data.fileSize);
		thisLi.find('.fileType text').text(data.fileType);
	};

	/**
	 * 移除数组中相应的对象
	 * @param  {[type]} arr  数组
	 * @param  {[type]} item 需要移除的对象
	 */
	function _remove(arr,item) {
      for(var i = arr.length; i--;) {
          if(arr[i] === item) {
              arr.splice(i, 1);
          }
      }
  };

})(jQuery)
