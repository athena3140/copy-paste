$(document).ready(function () {
	let socket;
	if (window.location.href == "https://localhost/clipboard/") {
		socket = new WebSocket("ws://localhost:8000");
	} else {
		socket = new WebSocket(`ws://${window.location.host}:8000`);
	}

	socket.onopen = function () {
		console.log("WebSocket connection established.");
		alertErr("Live Features activated");
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
				sendAjax(file);
			};
		} else {
			if (content.trim() === "") {
				$("#error").fadeIn();
			} else {
				sendAjax(content);
			}
		}

		function sendAjax(content) {
			$.ajax({
				url: "./api.php",
				method: "POST",
				data: {
					content: content,
				},
				dataType: "json",
				success: function (response) {
					$("#error").fadeOut();
					$("#img").val(null).trigger("change");
					$("#content").val("").blur().trigger("change");
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
						console.log("%c" + xhr.responseText, "color: #73510d; background-color: #fbf1dc;");
						$("#img").val(null).trigger("change");
					}
				},
			});
		}
	});

	function loadClipboardEntries() {
		$.ajax({
			url: "./api.php",
			method: "GET",
			dataType: "json",
			success: function (response) {
				var entries = "";
				for (var i = 0; i < response.length; i++) {
					entries += `
               ${
				isValidBase64URL(response[i].content)
					? `<div class="col-lg-10 col-md-8 row justify-content-center">
						<div class="card col-lg-6 position-relative p-0">
							<img data-image-id="${response[i].clipboard_id}"
								src="${response[i].content}"
								class="img-fluid base64img  card-header p-0 border-0" />
							<div class="img-gradient d-flex justify-content-between">
								<button
									type="button"
									class="btn btn-sm fs-5 rounded-0 start-0 btn-primary download shadow-0 btn-sm fs-5">
									<i class="fa-solid fa-download"></i>
								</button>
								<button data-clipboard-id="${response[i].clipboard_id}"
									type=" button"
									class="end-0 btn btn-sm fs-5 rounded-0 btn-danger delete shadow-0 btn-sm fs-5">
									<i class="fa-solid fa-trash"></i>
								</button>
							</div>
						</div>
					</div>`
					: `<div class="col-lg-10 col-md-8">
						<div class="input-group">
							${
								response[i].content.includes("http://") ||
								response[i].content.includes("https://")
									? `
									<button type="button" class="btn btn-primary copy shadow-0 btn-sm fs-5">
									<i class="fa-regular fa-clone"></i>
								</button>
								<button type="button" data-link="${response[i].content}"  class="btn link btn-info shadow-0 btn-sm fs-5">
									<i class="fa-solid fa-link"></i>
								</button>
								<div class="form-outline">
									<input
										type="text"
										readonly
										style="color: blue !important; cursor: pointer"
										class="text-center form-control link text-decoration-underline text-black form-control-lg"
										value="${response[i].content}" />
								</div>
								<button
									type="button"
									data-clipboard-id="${response[i].clipboard_id}"
									class="btn btn-danger delete  shadow-0 btn-sm fs-5">
									<i class="fa-solid fa-trash"></i>
								</button>
								`
									: `
								<button
									type="button"
									class="btn btn-primary copy shadow-0 btn-sm fs-5">
									<i class="fa-regular fa-clone"></i>
								</button>
								<div class="form-outline">
									<textarea ${
										response[i].content.includes('"')
											? "rows=2"
											: `${
													response[i].content.split(" ").length > 70
														? "rows='5'"
														: "rows='2'"
											  }`
									} class="form-control bg-white" readonly > ${
											response[i].content
									  } </textarea> 
								</div>
								<button
									type="button" data-clipboard-id="${response[i].clipboard_id}"
									class="btn btn-danger delete shadow-0 btn-sm fs-5">
									<i class="fa-solid fa-trash"></i>
								</button>`
							}
						</div>
					</div>`
			}
               `;
				}
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
					$(".deleteAll").css({ display: "none" });
				} else {
					$("#entries").html(entries);
					$(".deleteAll").css({ display: "block" });
				}
				callback();
			},
			error: function (xhr, status, error) {
				console.error(xhr.responseText);
			},
		});
	}
	loadClipboardEntries();

	function callback() {
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
			navigator.clipboard.writeText($(this).parent().find("input,textarea").val()).catch(function (error) {
				alert("Failed to copy value to clipboard: ", error);
			});
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
		$(".finalDeleteAll")
			.off()
			.click(function () {
				$.ajax({
					url: "./api.php?delete_all=true",
					method: "DELETE",
					dataType: "json",
					success: function (s) {
						loadClipboardEntries();
						$("#modal").modal("hide");
						socketNotice();
					},
					error: function (xhr, status, error) {
						alertErr(xhr.responseText);
					},
				});
			});

		$("input.link,button.link").click(function () {
			window.open($(this).attr("value") || $(this).attr("data-link"));
		});
		setTimeout(() => {
			$(".reload i").removeClass("reloadActive");
		}, 1000);
	}

	$("input#content").bind("paste", function () {
		setTimeout(() => {
			$(this).parents("form").submit();
		}, 10);
	});
	$(".reload").click(function () {
		$(".reload i").addClass("reloadActive");
		loadClipboardEntries();
	});
	function isValidBase64URL(str) {
		const regex = /^data:image\/[a-z]+;base64,[A-Za-z0-9+/]+=*$/;
		return regex.test(str);
	}
	$("#img").on("change", function () {
		if (this.files && this.files[0]) {
			$("#fileSelectNotice").parent("small").css("display", "block").find("span").text(this.files[0].name);
			$("#error").fadeOut();
			$("#content").prop("disabled", true);
		} else {
			$("#fileSelectNotice").parent("small").css("display", "none").find("span").text("");
			$("#content").prop("disabled", false);
		}
	});

	$("#fileSelectNotice + i.fa-xmark").click(function () {
		$("#img").val(null).trigger("change");
	});

	$(".entries").css("max-height", $(window).outerHeight(true) - $(".INPUT").outerHeight(true));
	window.onresize = function () {
		$(".entries").css("max-height", $(window).outerHeight(true) - $(".INPUT").outerHeight(true));
	};

	function handleBubbleMovement(event) {
		$(".bubble").removeClass("bubble-disable");
		var bubble = $(".bubble");
		setTimeout(function () {
			bubble.css({
				left: event.clientX - bubble.width() / 2 + "px",
				top: event.clientY - bubble.height() / 2 + "px",
			});
		}, 25);
	}

	if (window.matchMedia("(pointer: fine)").matches) {
		$(document).on("mousemove", handleBubbleMovement);
	} else {
		$(".bubble").detach();
	}
	$(document).on("mouseleave", function () {
		$(".drag-over").addClass("hide");
		setTimeout(() => {
			$(".bubble").addClass("bubble-disable");
		}, 30);
	});

	$("#content").keyup(function (e) {
		if (event.ctrlKey && event.key === "Enter") {
			$("#createForm").submit();
		}
		$("#error").fadeOut();
	});

	$("#content").change(function () {
		if ($(this).val() != "") {
			$("#img").prop("disabled", true);
			$("label[for=img]").addClass("disabled");
		} else {
			$("#img").prop("disabled", false);
			$("label[for=img]").removeClass("disabled");
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
		$(".alert-warning.position-fixed").html(text).addClass("active");
		setTimeout(() => {
			$(".alert-warning.position-fixed").removeClass("active");
		}, 4000);
	}

	function socketNotice() {
		const message = {
			action: "entry_created",
		};
		socket.send(JSON.stringify(message));
	}
});
