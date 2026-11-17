(() => {
  "use strict";

  const WIDTH = 960;
  const HEIGHT = 540;
  const STORAGE_KEY = "chand_learning_ppt_maker_v1";

  const $ = id => document.getElementById(id);

  let canvas;
  let slides = [];
  let activeSlide = 0;
  let zoom = 1;

  let history = [];
  let historyPosition = -1;
  let saveTimer = null;

  const backgroundPresets = [
    "#ffffff", "#f8fafc", "#eff6ff", "#dbeafe",
    "#172554", "#0f766e", "#14532d", "#7c2d12",
    "#f1f5f9", "#e0f2fe", "#ecfccb", "#fef9c3",
    "#1e293b", "#334155", "#f5f5f4", "#fae8ff",
    "#d1fae5", "#ffedd5", "#fee2e2", "#e0e7ff",
    "#fff7ed", "#f0fdf4", "#fdf2f8", "#ede9fe",
    "#1d4ed8", "#0f172a", "#fefce8", "#fce7f3",
    "#164e63", "#365314", "#7f1d1d", "#581c87",
    "#cffafe", "#dcfce7", "#fef3c7", "#e2e8f0",
    "#bfdbfe", "#a7f3d0", "#fecaca", "#ddd6fe"
  ];

  function createId() {
    return "slide_" + Date.now() + "_" +
      Math.random().toString(36).slice(2, 7);
  }

  function getCurrentSlide() {
    return slides[activeSlide];
  }

  function setStatus(message) {
    $("saveStatus").textContent = message;
  }

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  // -------------------------------------
  // PRESENTATION DATA
  // -------------------------------------

  function createInitialSlide() {
    return {
      id: createId(),
      name: "Slide 1",
      background: "#ffffff",
      objects: []
    };
  }

  function saveCanvasObjects() {
    if (!canvas || !slides[activeSlide]) return;

    slides[activeSlide].objects =
      canvas.getObjects().map(object =>
        object.toObject()
      );
  }

  // -------------------------------------
  // HISTORY: UNDO AND REDO
  // -------------------------------------

  function updateHistoryButtons() {
    $("undoBtn").disabled = historyPosition <= 0;
    $("redoBtn").disabled =
      historyPosition >= history.length - 1;
  }

  function recordHistory() {
    const state = JSON.stringify({
      slides: slides,
      activeSlide: activeSlide
    });

    if (history[historyPosition] === state) return;

    history = history.slice(0, historyPosition + 1);
    history.push(state);

    if (history.length > 40) {
      history.shift();
    }

    historyPosition = history.length - 1;
    updateHistoryButtons();
  }

  function restoreHistory(position) {
    if (position < 0 || position >= history.length) return;

    historyPosition = position;

    const data = JSON.parse(history[position]);

    slides = data.slides;
    activeSlide = Math.min(
      data.activeSlide,
      slides.length - 1
    );

    renderSlide();
    renderThumbnails();
    renderProperties();
    savePresentation(false);

    updateHistoryButtons();
  }

  // -------------------------------------
  // AUTOMATIC SAVING
  // -------------------------------------

  function savePresentation(addHistory = true) {
    if (addHistory) {
      saveCanvasObjects();
      recordHistory();
    }

    setStatus("Saving...");

    clearTimeout(saveTimer);

    saveTimer = setTimeout(() => {
      try {
        const data = {
          title: $("presentationTitle").value,
          slides: slides,
          activeSlide: activeSlide,
          savedAt: new Date().toISOString()
        };

        localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify(data)
        );

        setStatus("Saved on this device");
      } catch (error) {
        console.error(error);
        setStatus("Could not save");
      }
    }, 400);
  }

  function loadPresentation() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);

      if (!saved) {
        slides = [createInitialSlide()];
        return;
      }

      const data = JSON.parse(saved);

      if (!Array.isArray(data.slides) || !data.slides.length) {
        slides = [createInitialSlide()];
        return;
      }

      slides = data.slides;
      activeSlide = Math.max(
        0,
        Math.min(data.activeSlide || 0, slides.length - 1)
      );

      if (data.title) {
        $("presentationTitle").value = data.title;
      }

    } catch (error) {
      console.error("Loading error:", error);
      slides = [createInitialSlide()];
    }
  }

  // -------------------------------------
  // CANVAS INITIALISATION
  // -------------------------------------

  function initialiseCanvas() {
    canvas = new fabric.Canvas("slideCanvas", {
      width: WIDTH,
      height: HEIGHT,
      backgroundColor: "#ffffff",
      preserveObjectStacking: true,
      selection: true
    });

    canvas.on("object:modified", () => {
      savePresentation();
      renderThumbnails();
      renderProperties();
    });

    canvas.on("selection:created", renderProperties);
    canvas.on("selection:updated", renderProperties);
    canvas.on("selection:cleared", renderProperties);
  }

  // -------------------------------------
  // SLIDE RENDERING
  // -------------------------------------

  function renderSlide() {
    const slide = getCurrentSlide();

    if (!slide) return;

    canvas.discardActiveObject();

    const slideData = {
      objects: slide.objects || [],
      backgroundColor: slide.background || "#ffffff"
    };

    canvas.loadFromJSON(slideData, () => {
      canvas.getObjects().forEach(object => {
        object.setCoords();
      });

      canvas.requestRenderAll();
      renderProperties();
    });

    $("slideCounter").textContent =
      "Slide " + (activeSlide + 1) +
      " of " + slides.length;
  }

  // -------------------------------------
  // SLIDE THUMBNAILS
  // -------------------------------------

  function renderThumbnails() {
    const list = $("slideList");

    list.innerHTML = "";

    slides.forEach((slide, index) => {
      const button = document.createElement("button");

      button.type = "button";
      button.className =
        "slide-thumb" +
        (index === activeSlide ? " active" : "");

      const preview = document.createElement("div");
      preview.className = "thumb-canvas";
      preview.style.background = slide.background || "#ffffff";

      (slide.objects || []).slice(0, 10).forEach(object => {
        if (typeof object.text !== "string") return;

        const text = document.createElement("span");

        text.textContent = object.text.slice(0, 35);

        text.style.display = "block";
        text.style.fontSize = "7px";
        text.style.padding = "3px";
        text.style.color =
          typeof object.fill === "string"
            ? object.fill
            : "#172033";

        preview.appendChild(text);
      });

      const number = document.createElement("span");

      number.className = "thumb-number";
      number.textContent =
        (index + 1) + ". " + slide.name;

      button.append(preview, number);

      button.addEventListener("click", () => {
        saveCanvasObjects();

        activeSlide = index;

        renderSlide();
        renderThumbnails();
      });

      list.appendChild(button);
    });

    $("slideCounter").textContent =
      "Slide " + (activeSlide + 1) +
      " of " + slides.length;
  }

  // -------------------------------------
  // OBJECT PROPERTIES
  // -------------------------------------

  function renderProperties() {
    const panel = $("objectProperties");
    const object = canvas.getActiveObject();

    panel.innerHTML = "";

    if (!object) {
      const message = document.createElement("p");

      message.className = "muted";
      message.textContent =
        "Select an object to edit its properties.";

      panel.appendChild(message);
      return;
    }

    function addField(label, type, value, callback) {
      const wrapper = document.createElement("label");

      wrapper.className = "prop-label";
      wrapper.textContent = label;

      const input = document.createElement("input");

      input.type = type;
      input.className = "prop-control";
      input.value = value;

      input.addEventListener("change", () => {
        callback(input.value);

        canvas.requestRenderAll();
        savePresentation();
        renderThumbnails();
      });

      wrapper.appendChild(input);
      panel.appendChild(wrapper);
    }

    if (typeof object.text === "string") {
      addField(
        "Text",
        "text",
        object.text,
        value => object.set("text", value)
      );

      addField(
        "Font size",
        "number",
        object.fontSize || 28,
        value => object.set(
          "fontSize",
          Math.max(8, Math.min(160, Number(value) || 28))
        )
      );

      addField(
        "Text colour",
        "color",
        object.fill || "#172033",
        value => object.set("fill", value)
      );

      const boldButton = document.createElement("button");

      boldButton.className = "wide-btn";
      boldButton.textContent =
        object.fontWeight === "bold"
          ? "Remove bold"
          : "Make bold";

      boldButton.onclick = () => {
        object.set(
          "fontWeight",
          object.fontWeight === "bold" ? "normal" : "bold"
        );

        canvas.requestRenderAll();
        savePresentation();
        renderProperties();
      };

      panel.appendChild(boldButton);

    } else {
      addField(
        "Fill colour",
        "color",
        typeof object.fill === "string" ? object.fill : "#93c5fd",
        value => object.set("fill", value)
      );
    }

    addField(
      "Rotation",
      "number",
      Math.round(object.angle || 0),
      value => object.set("angle", Number(value) || 0)
    );

    const hint = document.createElement("p");

    hint.className = "muted";
    hint.textContent =
      "Drag to move. Use the corner handles to resize.";

    panel.appendChild(hint);
  }

  // -------------------------------------
  // ADD OBJECTS
  // -------------------------------------

  function addText() {
    const text = new fabric.IText(
      "Double-click to edit",
      {
        left: 100,
        top: 100,
        fontFamily: "Arial",
        fontSize: 34,
        fill: "#172033"
      }
    );

    canvas.add(text);
    canvas.setActiveObject(text);
    canvas.requestRenderAll();

    savePresentation();
    renderThumbnails();
    renderProperties();
  }

  function addShape() {
    const shape = new fabric.Rect({
      left: 150,
      top: 150,
      width: 240,
      height: 130,
      fill: "#93c5fd",
      stroke: "#1d4ed8",
      strokeWidth: 2,
      rx: 8,
      ry: 8
    });

    canvas.add(shape);
    canvas.setActiveObject(shape);
    canvas.requestRenderAll();

    savePresentation();
    renderThumbnails();
    renderProperties();
  }

  function addImage(file) {
    if (!file || !file.type.startsWith("image/")) return;

    const reader = new FileReader();

    reader.onload = () => {
      fabric.Image.fromURL(reader.result, image => {
        const scale = Math.min(
          420 / image.width,
          300 / image.height,
          1
        );

        image.set({
          left: 100,
          top: 90,
          scaleX: scale,
          scaleY: scale
        });

        canvas.add(image);
        canvas.setActiveObject(image);
        canvas.requestRenderAll();

        savePresentation();
        renderThumbnails();
        renderProperties();
      });
    };

    reader.readAsDataURL(file);
  }

  // -------------------------------------
  // SLIDE MANAGEMENT
  // -------------------------------------

  function addSlide() {
    saveCanvasObjects();

    slides.splice(activeSlide + 1, 0, {
      id: createId(),
      name: "Slide " + (slides.length + 1),
      background: "#ffffff",
      objects: []
    });

    activeSlide++;

    renderSlide();
    renderThumbnails();
    savePresentation();
  }

  function duplicateSlide() {
    saveCanvasObjects();

    const copy = clone(getCurrentSlide());

    copy.id = createId();
    copy.name = "Slide " + (slides.length + 1);

    slides.splice(activeSlide + 1, 0, copy);

    activeSlide++;

    renderSlide();
    renderThumbnails();
    savePresentation();
  }

  function deleteSlide() {
    if (slides.length <= 1) {
      alert("At least one slide is required.");
      return;
    }

    slides.splice(activeSlide, 1);

    activeSlide = Math.max(0, activeSlide - 1);

    renderSlide();
    renderThumbnails();
    savePresentation();
  }

  // -------------------------------------
  // SLIDE BACKGROUNDS
  // -------------------------------------

  function applyBackground(color) {
    getCurrentSlide().background = color;

    canvas.setBackgroundColor(
      color,
      canvas.requestRenderAll.bind(canvas)
    );

    renderThumbnails();
    savePresentation();
  }

  function createBackgroundPresets() {
    const container = $("backgroundPresets");

    backgroundPresets.forEach(color => {
      const button = document.createElement("button");

      button.type = "button";
      button.className = "bg-preset";
      button.style.background = color;
      button.title = "Apply " + color;

      button.addEventListener("click", () => {
        $("backgroundColor").value = color;
        applyBackground(color);
      });

      container.appendChild(button);
    });
  }

  // -------------------------------------
  // ZOOM
  // -------------------------------------

  function applyZoom() {
    zoom = Math.max(0.5, Math.min(1.25, zoom));

    const frame = document.querySelector(".canvas-frame");

    frame.style.transform = "scale(" + zoom + ")";
    frame.style.transformOrigin = "center center";

    $("zoomLabel").textContent =
      Math.round(zoom * 100) + "%";
  }

  // -------------------------------------
  // PRESENTATION MODE
  // -------------------------------------

  function showPresentationSlide() {
    const host = $("presentSlide");

    host.innerHTML = "";

    const previewCanvas = document.createElement("canvas");

    previewCanvas.width = WIDTH;
    previewCanvas.height = HEIGHT;

    host.appendChild(previewCanvas);

    const preview = new fabric.StaticCanvas(previewCanvas, {
      width: WIDTH,
      height: HEIGHT
    });

    const slide = getCurrentSlide();

    preview.loadFromJSON({
      objects: slide.objects || [],
      backgroundColor: slide.background || "#ffffff"
    }, () => {
      preview.requestRenderAll();
    });

    $("presentCount").textContent =
      (activeSlide + 1) + " / " + slides.length;
  }

  function startPresentation() {
    saveCanvasObjects();

    $("presentOverlay").hidden = false;

    showPresentationSlide();
  }

  function nextPresentationSlide() {
    if (activeSlide >= slides.length - 1) return;

    saveCanvasObjects();

    activeSlide++;

    renderSlide();
    renderThumbnails();
    showPresentationSlide();
  }

  function previousPresentationSlide() {
    if (activeSlide <= 0) return;

    saveCanvasObjects();

    activeSlide--;

    renderSlide();
    renderThumbnails();
    showPresentationSlide();
  }

  // -------------------------------------
  // POWERPOINT EXPORT
  // -------------------------------------

  async function exportPowerPoint() {
    saveCanvasObjects();

    if (typeof window.pptxgen !== "function") {
      alert(
        "PowerPoint export library did not load. " +
        "Check your internet connection and reload the page."
      );
      return;
    }

    try {
      const pptx = new window.pptxgen();

      pptx.layout = "LAYOUT_WIDE";
      pptx.author = "Chand Learning";
      pptx.subject = "Chand Learning Presentation";

      slides.forEach(slideData => {
        const slide = pptx.addSlide();

        slide.background = {
          color: slideData.background.replace("#", "")
        };

        (slideData.objects || []).forEach(object => {
          const x = (object.left || 0) / WIDTH * 13.333;
          const y = (object.top || 0) / HEIGHT * 7.5;

          const width =
            (object.width || 0) *
            (object.scaleX || 1) / WIDTH * 13.333;

          const height =
            (object.height || 0) *
            (object.scaleY || 1) / HEIGHT * 7.5;

          if (
            object.type === "i-text" ||
            object.type === "textbox" ||
            object.type === "text"
          ) {
            slide.addText(object.text || "", {
              x,
              y,
              w: Math.max(0.2, width),
              h: Math.max(0.2, height),
              fontFace: object.fontFamily || "Arial",
              fontSize: (object.fontSize || 24) * 0.75,
              color:
                typeof object.fill === "string"
                  ? object.fill.replace("#", "")
                  : "172033",
              bold: object.fontWeight === "bold",
              italic: object.fontStyle === "italic",
              align: object.textAlign || "left",
              margin: 0,
              rotate: object.angle || 0
            });

          } else if (
            object.type === "rect" ||
            object.type === "ellipse"
          ) {
            slide.addShape(
              object.type === "ellipse"
                ? pptx.ShapeType.ellipse
                : pptx.ShapeType.rect,
              {
                x,
                y,
                w: Math.max(0.05, width),
                h: Math.max(0.05, height),
                fill: {
                  color:
                    typeof object.fill === "string"
                      ? object.fill.replace("#", "")
                      : "93C5FD"
                },
                line: {
                  color:
                    typeof object.stroke === "string"
                      ? object.stroke.replace("#", "")
                      : "93C5FD",
                  width: object.strokeWidth || 0
                },
                rotate: object.angle || 0
              }
            );

          } else if (
            object.type === "image" &&
            typeof object.src === "string" &&
            object.src.startsWith("data:image/")
          ) {
            slide.addImage({
              data: object.src,
              x,
              y,
              w: Math.max(0.05, width),
              h: Math.max(0.05, height),
              rotate: object.angle || 0
            });
          }
        });
      });

      const title =
        $("presentationTitle").value.trim() ||
        "Chand-Learning-Presentation";

      await pptx.writeFile({
        fileName: title + ".pptx"
      });

      setStatus("PowerPoint exported");

    } catch (error) {
      console.error("PowerPoint export error:", error);

      alert(
        "PowerPoint export failed. " +
        "Please check the browser connection and try again."
      );
    }
  }

  // -------------------------------------
  // BUTTONS AND EVENTS
  // -------------------------------------

  function connectEvents() {
    $("addSlideBtn").onclick = addSlide;
    $("duplicateSlideBtn").onclick = duplicateSlide;
    $("deleteSlideBtn").onclick = deleteSlide;

    $("addTextBtn").onclick = addText;
    $("addShapeBtn").onclick = addShape;

    $("imageInput").onchange = event => {
      addImage(event.target.files[0]);
      event.target.value = "";
    };

    $("deleteObjectBtn").onclick = () => {
      const object = canvas.getActiveObject();

      if (!object) return;

      canvas.remove(object);
      canvas.discardActiveObject();
      canvas.requestRenderAll();

      savePresentation();
      renderThumbnails();
      renderProperties();
    };

    $("backgroundColor").oninput = event => {
      applyBackground(event.target.value);
    };

    $("undoBtn").onclick = () => {
      restoreHistory(historyPosition - 1);
    };

    $("redoBtn").onclick = () => {
      restoreHistory(historyPosition + 1);
    };

    $("presentationTitle").oninput = () => {
      savePresentation(false);
    };

    $("exportBtn").onclick = exportPowerPoint;

    $("presentBtn").onclick = startPresentation;

    $("closePresentBtn").onclick = () => {
      $("presentOverlay").hidden = true;
    };

    $("
