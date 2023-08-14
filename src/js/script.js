$(document).ready(function () {
	// web socket [enable live datas update]
	var socket;
	alrtSoc = true;

	function createWebSocket() {
		if (window.location.href == "https://localhost/clipboard/") {
			socket = new WebSocket("ws://localhost:8000");
		} else {
			socket = new WebSocket(`ws://${window.location.host}:8000`);
		}

		socket.onopen = function () {
			console.log("WebSocket connection established.");
			if (alrtSoc) {
				setTimeout(() => {
					alertErr("Live Features activated.");
				}, 1000);
				alrtSoc = false;
			}
		};

		socket.onmessage = function () {
			loadClipboardEntries();
		};

		socket.onclose = function () {
			console.log("WebSocket connection closed.");
		};

		socket.onerror = function (error) {
			alertErr("Can not use live features");
			console.error("WebSocket error:", error);
		};
	}
	createWebSocket();
	document.addEventListener("visibilitychange", function () {
		if (document.visibilityState === "visible") {
			createWebSocket();
		}
	});

	// Data Creation
	$("#createForm").submit(function (event) {
		event.preventDefault();

		var reader = new FileReader();
		var content = $("#content").val();
		img = $("#img")[0].files[0];

		if (img) {
			var file;
			reader.readAsDataURL($("#img")[0].files[0]);
			reader.onload = function () {
				file = reader.result;
				sendAjax(file, "image");
			};
		} else {
			if (content.trim() === "") {
				$("#error").fadeIn();
			} else {
				sendAjax(content, "text");
			}
		}

		function sendAjax(content, type) {
			$.ajax({
				url: "./api.php",
				method: "POST",
				data: {
					content: content,
					type: type,
				},
				dataType: "json",
				success: function () {
					$("#error").fadeOut();
					$("#img").val(null).trigger("change");
					$("#content").val("").blur().trigger("input");
					loadClipboardEntries();
					socketNotice();
				},
				error: function (xhr, status, error) {
					if (
						xhr.responseText.indexOf(
							"Uncaught mysqli_sql_exception: MySQL server has gone away"
						) !== -1
					) {
						alertErr(
							"Error: File is too large or an unexpected error occurred. See console for details."
						);
						console.log("%c" + xhr.responseText, "color: #d9534f;");
						$("#img").val(null).trigger("change");
					}
				},
			});
		}
	});

	//data fetching
	function loadClipboardEntries() {
		$.ajax({
			url: "./api.php",
			method: "GET",
			dataType: "json",
			success: function (response) {
				if (response.status == "not_found") {
					$("#entries").html(
						`<div class="alert d-flex flex-column m-0 col-lg-10 alert-warning bg-gradient text-center">
							<span class="h1">
								<i class="fa-solid fa-database fa-fade"></i>
								<b class="ms-3">No Data Found.</b>
							</span>
							<span>Try add <a onclick="document.getElementById('labelImg').click()" href="javascript:void(0)">Image</a>/<a onclick="document.getElementById('content').focus()" href="javascript:void(0)">Text</a></span>
						</div>`
					);
					$(".deleteBtnGroup button").css({ display: "none" });
				} else {
					entries = "";
					for (i = 0; i < response.length; i++) {
						entries += `${
							isValidBase64URL(response[i].content)
								? `
								<div class="col-lg-10 col-md-8 row justify-content-center">
									<div class="card col-lg-6 position-relative p-0">
											<img class="img-fluid base64img card-header p-0 border-0"
												data-image-id="${response[i].clipboard_id}" src="${response[i].content}" />
										<div class="img-gradient d-flex justify-content-between">
											<button type="button" class="btn btn-sm fs-5 rounded-0 start-0 btn-primary download shadow-0 btn-sm fs-5">
												<i class="fa-solid fa-download"></i>
											</button>
											<button data-clipboard-id="${response[i].clipboard_id}" type=" button" class="end-0 btn btn-sm fs-5 rounded-0 btn-danger delete shadow-0 btn-sm fs-5">
												<i class="fa-solid fa-trash"></i>
											</button>
										</div>
									</div>
								</div>`
								: `
								<div class="col-lg-10 col-md-8">
									<div class="input-group">
								<button
									type="button"
									class="btn btn-primary copy shadow-0 btn-sm fs-5">
									<i class="fa-regular fa-copy"></i>
								</button>
								<div class="form-outline">
								${
									response[i].content.match(
										/^(http|https|mailto|ftp|tel|file|javascript|data):/
									)
										? `
										<input type="text" readonly class="form-control link text-decoration-underline bg-white form-control-lg"
										value="${response[i].content}" />
									`
										: `<textarea class="form-control bg-white" readonly ${
												response[i].content.length > 70 ? "rows=5" : "rows=2"
										  }
										>${response[i].content}</textarea> `
								}
								</div>
								<button type="button" class="btn btn-danger delete shadow-0 btn-sm fs-5"
								 	data-clipboard-id="${response[i].clipboard_id}">
									<i class="fa-solid fa-trash"></i>
								</button>`
						}
						</div>
					</div>`;
					}
					$("#entries").html(entries);
				}
				imagesToBlob();
				callback();
			},
			error: function (xhr, status, error) {
				console.error(xhr.responseText);
			},
		});
	}
	loadClipboardEntries();

	//function to be call after data fetching
	function callback() {
		const $entriesTextarea = $("#entries textarea");
		const $entriesImg = $("#entries img");

		$(".deleteBtnGroup .all").css({
			display: $entriesTextarea.length > 0 && $entriesImg.length > 0 ? "block" : "none",
		});
		$(".deleteBtnGroup .text").css({ display: $entriesTextarea.length > 0 ? "block" : "none" });
		$(".deleteBtnGroup .img").css({ display: $entriesImg.length > 0 ? "block" : "none" });

		setTimeout(() => {
			$("input:not(input.link),textarea,.alert-warning.position-fixed").hover(
				function () {
					$(".bubble").addClass("bubble-text");
				},
				function () {
					$(".bubble").removeClass("bubble-text");
				}
			);
			$("input.link,button,label[for='img'],i.fa-xmark,a[href='javascript:void(0)']").hover(
				function () {
					$(".bubble").addClass("bubble-active");
				},
				function () {
					$(".bubble").removeClass("bubble-active");
				}
			);

			$("input.link,button,label[for='img'],i.fa-xmark,a[href='javascript:void(0)']").mousedown(
				function () {
					$(".bubble").addClass("bubble-down");
				}
			);
			$(document).mouseup(function () {
				$(".bubble").removeClass("bubble-down");
			});
		}, 10);

		$("button.copy").click(function () {
			var copyText = $(this).parent().find("input,textarea");
			copyText.select();
			document.execCommand("copy");
			window.getSelection().removeAllRanges();
		});

		$("button.download").click(function () {
			var imgUrl = $(this).closest(".card").find("img");
			$("<a>", {
				href: imgUrl.attr("src"),
				download: `Clipboard_${imgUrl.attr("data-image-id")}.png`,
			})[0].click();
		});

		$("button.delete").click(function () {
			$.ajax({
				url: "./api.php",
				method: "DELETE",
				data: {
					clipboard_id: $(this).attr("data-clipboard-id"),
				},
				dataType: "json",
				success: function () {
					loadClipboardEntries();
					socketNotice();
				},
				error: function (xhr, status, error) {
					console.error(xhr.responseText);
				},
			});
		});

		$("input.link").click(function () {
			window.open($(this).attr("value"));
		});
		setTimeout(() => {
			$(".reload i").removeClass("reloadActive");
		}, 1000);
	}

	//features for the application
	$(".deleteBtnGroup button").click(function () {
		$(".modal span.text-warning").html($(this).attr("data-modal-type") + "s");
		$(".modalAccept").attr("data-delete-type", $(this).attr("data-modal-type"));
		$(".modal").modal("show");
	});

	$(".modalAccept").click(function () {
		$.ajax({
			url: "./api.php",
			method: "DELETE",
			data: {
				type: $(this).attr("data-delete-type"),
			},
			dataType: "json",
			success: function () {
				$(".modal").modal("hide");
				loadClipboardEntries();
				socketNotice();
			},
			error: function (xhr, status, error) {
				alertErr(xhr.responseText);
				console.log(xhr.responseText);
			},
		});
	});

	$(".reload").click(function () {
		$(".reload i").addClass("reloadActive");
		loadClipboardEntries();
	});

	$("#fileSelectNotice + i.fa-xmark").click(function () {
		$("#img").val(null).trigger("change");
	});

	//design control with JS
	(() => {
		$(".entries").css("max-height", $(window).outerHeight(true) - $(".INPUT").outerHeight(true));
		$("textarea").each(function () {
			$(this).css({ minHeight: $(this).outerHeight() });
		});
		window.onresize = function () {
			$(".entries").css("max-height", $(window).outerHeight(true) - $(".INPUT").outerHeight(true));
		};
		let resizeObserver = new ResizeObserver(() => {
			$(".entries").css("max-height", $(window).outerHeight(true) - $(".INPUT").outerHeight(true));
		});
		resizeObserver.observe($("#content")[0]);
	})();

	$(document).on("mouseleave", function () {
		$(".drag-over").addClass("hide");
		setTimeout(() => {
			$(".bubble").addClass("bubble-disable");
		}, 30);
	});

	$("#content").keydown(function (e) {
		if (event.ctrlKey && event.key === "Enter") {
			$("#createForm").submit();
		}
		if (e.keyCode === 9) {
			e.preventDefault();
			var start = this.selectionStart,
				end = this.selectionEnd;
			$(this).val($(this).val().substring(0, start) + "\t" + $(this).val().substring(end));
			this.selectionStart = this.selectionEnd = start + 1;
		}
	});

	$("body").keydown(function (e) {
		if (e.ctrlKey && e.key === "k") {
			e.preventDefault();
			$("#content").is(":focus") ? $("#content").blur() : $("#content").focus();
		}
	});

	// disable image while text in #content
	$("#content").on("input change", function () {
		if ($(this).val() != "") {
			$("#img").prop("disabled", true);
			$("label[for=img]").addClass("disabled");
		} else {
			$("#img").prop("disabled", false);
			$("label[for=img]").removeClass("disabled");
		}
	});

	// disable #content while file in #img
	$("#img").on("change", function () {
		if (this.files && this.files[0]) {
			$("#fileSelectNotice").parent("small").css("display", "block").find("span").text(this.files[0].name);
			$("#error").fadeOut();
			$("#content").prop("disabled", true);
			$("#imgPreview").attr("src", URL.createObjectURL(this.files[0]));
		} else {
			$("#fileSelectNotice").parent("small").css("display", "none").find("span").text("");
			$("#content").prop("disabled", false);
		}
	});

	$(".container-fluid").on("dragover", function (e) {
		e.preventDefault();
		$(".drag-over").removeClass("hide");
	});

	document.addEventListener("visibilitychange", () => {
		$(".drag-over").addClass("hide");
	});

	$(".container-fluid").on("drop", function (e) {
		e.preventDefault();
		$(".drag-over").addClass("hide");
		var file = e.originalEvent.dataTransfer.files[0];
		validateImage(file, function (isValid) {
			if (isValid) {
				const dataTransfer = new DataTransfer();
				dataTransfer.items.add(file);
				$("#img").prop("files", dataTransfer.files).trigger("change");
			} else {
				alertErr("Supported file types: Images only.");
				console.warn("Supported file types: Images only.");
			}
		});
		if (e.originalEvent.dataTransfer.files.length === 0) {
			$(".drag-over").addClass("hide");
		}
	});

	if (!navigator.clipboard) {
		$(".fa-paste").parent().remove();
	}
	if (navigator.userAgent.match(/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i)) {
		$(".ctrlK").detach();
	}
	if (window.matchMedia("(pointer: fine)").matches) {
		$(document).on("mousemove", handleBubbleMovement);
	} else {
		$(".bubble").detach();
	}

	//fuctions that are need for the application
	function validateImage(file, callback) {
		var img = new Image();
		img.onload = function () {
			callback(true);
		};
		img.onerror = function () {
			callback(false);
		};
		img.src = URL.createObjectURL(file);
	}

	function alertErr(text) {
		$(".alert-danger.position-fixed").html(text).addClass("active");
		setTimeout(() => {
			$(".alert-danger.position-fixed").removeClass("active");
		}, 4000);
	}

	function handleBubbleMovement(event) {
		$(".bubble").removeClass("bubble-disable");
		var bubble = $(".bubble");
		setTimeout(function () {
			bubble.css({
				left: event.clientX - bubble.width() / 2 + "px",
				top: event.clientY - bubble.height() / 2 + "px",
			});
		}, 42);
	}

	function isValidBase64URL(str) {
		const regex = /^data:image\/[a-z]+;base64,[A-Za-z0-9+/]+=*$/;
		return regex.test(str);
	}

	function socketNotice() {
		const message = {
			action: "entry_created",
		};
		socket.send(JSON.stringify(message));
	}

	function imagesToBlob() {
		var $image = $(".base64img");
		if ($image.length > 0) {
			var imgSrc = $image.attr("src").split(",");
			var uint8Array = new Uint8Array([...atob(imgSrc[1])].map((c) => c.charCodeAt(0)));
			var blob = new Blob([uint8Array], { type: imgSrc[0].split(":")[1].split(";")[0] });
			$image.attr("src", URL.createObjectURL(blob));
		}
	}
});
