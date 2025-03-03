function getQuizData() {
  return [
    {
      question: "Which section of the SSL AWS 900+ console is used to select among different sets of speakers?",
      options: [
        "Patch Bay",
        "Speaker Select Section of the Control Room Monitor System",
        "Mix Bus Section",
        "Input Channel Strip"
      ],
      answer: 1,
      explanation: "The speaker select section on the control room monitor system is used to choose between the default (normal set), 5.1 set, mini A, and mini B speakers."
    },
    {
      question: "On the patch bay, when a source (for example, a Blu-ray player) is 'normal' to External A1, what does that mean?",
      options: [
        "The signal is routed to External A1 only when patched manually.",
        "The signal is automatically connected to External A1 unless a patch cable is inserted that breaks the normal.",
        "The output is muted by default until overridden.",
        "The signal requires amplification before reaching External A1."
      ],
      answer: 1,
      explanation: "Normal connections are the built‐in signal paths on the patch bay. They automatically route the signal unless the normal is broken by inserting a patch cable."
    },
    {
      question: "What is a 'dead patch' in the context of the SSL patch bay?",
      options: [
        "A patch where both ends are connected normally.",
        "A patch where one cable is connected at the source but the other end is not connected to any destination, breaking the normal routing.",
        "A patch that automatically sums two signals.",
        "A patch used exclusively for test tones."
      ],
      answer: 1,
      explanation: "A 'dead patch' occurs when a patch cable is connected at one end but not the other, thereby interrupting the normal routing."
    },
    {
      question: "What is the primary function of the 'cut' button on the control room monitor system?",
      options: [
        "To lower the overall volume gradually",
        "To switch between different input sources",
        "To completely remove (mute) the audio output from the monitor system",
        "To engage a delayed listening mode"
      ],
      answer: 2,
      explanation: "Pressing the 'cut' button removes the audio output from the control room monitor system, muting all sound."
    },
    {
      question: "Which button is used to attenuate (reduce) the monitor system's volume without completely muting it?",
      options: [
        "Dim Button",
        "Cut Button",
        "Solo Button",
        "Balance Button"
      ],
      answer: 0,
      explanation: "The 'dim' button lowers the room volume by a preset amount (for example, a 10‑dB reduction) without completely shutting off the output."
    },
    {
      question: "One of your homework assignments is to create a patch bay diagram. What is the main purpose of this exercise?",
      options: [
        "To memorize every cable color in the studio",
        "To become familiar with the locations of inputs, outputs, effects returns, inserts, and master outs for troubleshooting",
        "To redesign the studio layout from scratch",
        "To create a digital recording of all patch points"
      ],
      answer: 1,
      explanation: "Drawing your own patch bay diagram helps you quickly identify critical connections for troubleshooting."
    },
    {
      question: "What is the primary difference between External A and External B inputs on the SSL console?",
      options: [
        "External A accepts microphone signals, while External B accepts line signals",
        "External A inputs are 5.1 surround (six-channel) and External B inputs are stereo (two-channel)",
        "External A is used for recording and External B for live monitoring",
        "There is no functional difference between External A and B"
      ],
      answer: 1,
      explanation: "External A inputs are designed for 5.1 surround signals, while External B inputs are configured for stereo signals."
    },
    {
      question: "Each main channel strip on the SSL console can accept three types of input signals. Which of the following are they?",
      options: [
        "Digital, Analog, and Optical",
        "Microphone, Line, and Instrument",
        "Stereo, Mono, and Balanced",
        "Preamp, Compressor, and EQ"
      ],
      answer: 1,
      explanation: "The console is designed to handle three input types: microphone level (with preamplification), line level, and instrument level."
    },
    {
      question: "Instrument level inputs on the SSL console are generally associated with which approximate level?",
      options: [
        "–60 dB",
        "0 dB",
        "–14 dB",
        "+4 dB"
      ],
      answer: 2,
      explanation: "Instrument level is typically around –14 dB, although there can be some variation."
    },
    {
      question: "What kind of signal level should be expected at the stereo effects return?",
      options: [
        "Microphone level",
        "Instrument level",
        "Line level",
        "Digital level"
      ],
      answer: 2,
      explanation: "Stereo effects returns are used for signals coming from outboard processors (like reverb or delay units) and are already at line level."
    },
    {
      question: "In a troubleshooting scenario where one side of a stereo pair is silent, what is an appropriate first step?",
      options: [
        "Replace the entire console",
        "Check the patch bay to verify that the cable (such as an SLR cable) is securely connected",
        "Immediately increase the monitor level",
        "Switch all inputs to external B"
      ],
      answer: 1,
      explanation: "A common troubleshooting step is to inspect the patch bay for loose or unplugged cables that could interrupt the signal."
    },
    {
      question: "What is the function of the 'after fade listen' (AFL) feature on the console?",
      options: [
        "To preview a channel before it is added to the mix",
        "To monitor the signal level after the fader, which might differ from the pre-fader mix",
        "To automatically balance left and right channels",
        "To route a signal exclusively to the headphones"
      ],
      answer: 1,
      explanation: "AFL lets you listen to the signal after the fader's attenuation, giving you a true representation of the output level."
    },
    {
      question: "In the oscillator scenario, to send a 1000 Hz tone to the left speaker only using the stereo effects return, which control is essential for directing the signal?",
      options: [
        "The cut button",
        "The balance knob (in combination with setting the module to full stereo)",
        "The dim button",
        "The direct outs"
      ],
      answer: 1,
      explanation: "The balance knob is used to pan the signal—when set appropriately, it directs the tone solely to the left speaker."
    },
    {
      question: "When routing the stereo mix to Pro Tools for recording, why is it important to avoid a feedback loop?",
      options: [
        "Because the console automatically mutes all direct outs",
        "Because Pro Tools' direct monitoring can inadvertently feed the signal back into the input if not properly isolated",
        "Because feedback loops increase the system's digital latency",
        "Because the monitor system will then only output mono"
      ],
      answer: 1,
      explanation: "Using Pro Tools' direct monitoring without proper isolation can create a feedback loop, so correct routing is essential."
    },
    {
      question: "What is the benefit of summing external signals (for example, combining external A and B) in the control room monitor system?",
      options: [
        "It allows you to create a mono mix for all outputs",
        "It lets you blend signals from different sources into one output for checking a combined mix or for creative effects",
        "It automatically increases the overall volume",
        "It isolates the signal from further processing"
      ],
      answer: 1,
      explanation: "Summing signals lets you blend separate sources into one output, which can help in checking a combined mix or achieving creative effects."
    },
    {
      question: "To route a microphone signal from the ISO booth to Pro Tools, which steps are correct?",
      options: [
        "Patch the ISO mic output to a channel's line input, enable phantom power, route direct out to Pro Tools.",
        "Patch the ISO mic output to a channel's mic input, disable phantom power, route via bus to Pro Tools.",
        "Patch the ISO mic output to a channel's mic input, trim the preamp, route direct out to Pro Tools.",
        "Use an external preamp, patch to Pro Tools via the stereo effect returns."
      ],
      answer: 2,
      explanation: "Since mic inputs have built-in preamps, you need to use the mic input with proper trim and direct out for recording."
    },
    {
      question: "A vocalist's microphone is plugged into Channel 15, but no signal reaches Pro Tools. The Cut button is disengaged, and the fader is up. What is the MOST likely issue?",
      options: [
        "The Direct Out for Channel 15 is not patched to Pro Tools.",
        "The Mix Bus fader is muted.",
        "The Pro Tools track is set to playback mode.",
        "The microphone requires phantom power, which is off."
      ],
      answer: 0,
      explanation: "Direct Out must be patched to Pro Tools; no signal suggests a broken routing."
    },
    {
      question: "You want to route a guitar DI signal from Line Input 5 to an external compressor before recording it into Pro Tools. How do you patch this?",
      options: [
        "Use the Insert Send on Channel 5 → Compressor → Insert Return on Channel 5 → Direct Out 5 → Pro Tools.",
        "Patch Line Input 5 → Pro Tools Track 5 → Compressor → Mix Bus.",
        "Route Channel 5 to Bus 3-4 → Compressor → Pro Tools Track 3-4.",
        "Direct Out 5 → Compressor → Line Input 24 → Pro Tools Track 24."
      ],
      answer: 0,
      explanation: "Inserts allow external processing before the Direct Out sends the signal to Pro Tools."
    },
    {
      question: "The Control Room monitors are silent, but headphones work. What should you check FIRST?",
      options: [
        "The Monitor Source selector (e.g., Mix Bus vs. Aux).",
        "The headphone volume knob.",
        "The Pro Tools playback engine settings.",
        "The patch bay connections for the Mix Bus."
      ],
      answer: 0,
      explanation: "The Monitor Source selector determines what the Control Room speakers play."
    },
    {
      question: "A student hears a loud hum through a microphone. Which action will NOT solve the issue?",
      options: [
        "Engaging the ground lift on the DI box.",
        "Repatching the mic to a line input.",
        "Replacing a damaged XLR cable.",
        "Turning off phantom power for that channel."
      ],
      answer: 1,
      explanation: "Repatching the mic to a line input won't fix a ground hum because line inputs lack preamps."
    },
    {
      question: "How do you route signals from Pro Tools Outputs 3-4 to the Studio Monitors instead of the Control Room?",
      options: [
        "Assign Pro Tools Outputs 3-4 to Bus 3-4 and route Bus 3-4 to Studio Monitors.",
        "Patch Pro Tools Outputs 3-4 directly to the Studio Monitor inputs on the patch bay.",
        "Use the Monitor Assign section to route Mix Bus 3-4 to Studio Monitors.",
        "Engage the AFL button on Channels 3-4."
      ],
      answer: 1,
      explanation: "Studio Monitors often have dedicated patch points separate from the Control Room."
    },
    {
      question: "When using AFL (After Fader Listen) on a channel, what does it allow you to hear?",
      options: [
        "The raw input signal before the channel fader.",
        "The signal post-fader, including EQ and dynamics.",
        "Only the reverb effect on that channel.",
        "The signal routed to the Mix Bus."
      ],
      answer: 1,
      explanation: "AFL monitors the signal after the channel fader and processing."
    },
    {
      question: "You need to record a stereo synth into Pro Tools Tracks 5-6. How should you patch it?",
      options: [
        "Synth L/R → Line Inputs 5-6 → Direct Outs 5-6 → Pro Tools 5-6.",
        "Synth L/R → External Inputs A1-A2 → Bus 5-6 → Pro Tools 5-6.",
        "Synth L/R → Stereo Effect Returns 1-2 → Pro Tools 5-6.",
        "Synth L/R → Mic Inputs 10-11 → Direct Outs 10-11 → Pro Tools 5-6."
      ],
      answer: 0,
      explanation: "Using Line Inputs 5-6 with their Direct Outs routes the stereo synth directly to Pro Tools."
    },
    {
      question: "Why would you use a half-normalled patch bay connection instead of a fully-normalled one?",
      options: [
        "To allow simultaneous connection of input and output without breaking the default signal path.",
        "To prevent feedback in live microphone setups.",
        "To route signals through external effects permanently.",
        "To prioritize digital signals over analog ones."
      ],
      answer: 0,
      explanation: "Half-normalled connections allow you to use inserts without interrupting the default signal path."
    },
    {
      question: "What best describes a half‑normal patch on the SSL patch bay?",
      options: [
        "A patch that completely isolates the source from the destination",
        "A patch that maintains the built‑in (normal) connection while allowing an inserted cable to tap the signal",
        "A patch that duplicates the signal to two separate outputs",
        "A patch that only works with microphone signals"
      ],
      answer: 1,
      explanation: "A half‑normal patch allows the normal, built‑in signal path to remain intact while you also tap the signal using an inserted patch cable. This is useful when you want to monitor or process a signal without disrupting the default routing."
    },
    {
      question: "During troubleshooting, why are the output meters on the control room monitor so important?",
      options: [
        "They show the equalization settings for each channel",
        "They indicate the presence and level of the signal in a given source, helping identify if a cable or connection is faulty",
        "They automatically correct any signal issues",
        "They are only used for adjusting headphone levels"
      ],
      answer: 1,
      explanation: "The output meters provide a visual representation of signal levels. If a channel shows no activity while you expect sound, it can signal a broken connection, an unplugged cable, or a patch issue."
    },
    {
      question: "What is the primary benefit of using the summing function on the control room monitor system?",
      options: [
        "It isolates a signal from further processing",
        "It enables the engineer to combine signals from different external inputs (for example, External A and B) into one cohesive output",
        "It mutes all signals except for the one being summed",
        "It only works with direct outputs from the mix bus"
      ],
      answer: 1,
      explanation: "Summing lets you blend two separate sources together. This is particularly useful for creating a combined monitoring mix or applying creative processing by mixing two signal paths."
    },
    {
      question: "When routing the mix output into Pro Tools, why must the engineer be cautious about the Pro Tools input mode?",
      options: [
        "Because the console's preamp may overload the input",
        "Because improper isolation can create a feedback loop if the signal from Pro Tools' output feeds back into its input",
        "Because it automatically mutes the console's monitor output",
        "Because it requires digital conversion first"
      ],
      answer: 1,
      explanation: "Routing the mix output back into Pro Tools without proper isolation may result in a feedback loop, as Pro Tools' direct monitoring can inadvertently send the same signal back into the console. Ensuring that Pro Tools is set to the correct input mode is key to preventing this issue."
    },
    {
      question: "What is the function of the balance knob in the context of stereo effects returns or oscillator routing?",
      options: [
        "It controls the overall volume of the console",
        "It adjusts the panning of the signal between the left and right channels, allowing you to direct a signal (for example, a 1000 Hz tone) predominantly to one speaker",
        "It increases the gain for the input signal",
        "It toggles between mono and stereo outputs"
      ],
      answer: 1,
      explanation: "The balance knob is used to pan the signal within the stereo field. By adjusting the balance, you can send more of the signal to one side (such as the left speaker) while reducing its presence on the other side."
    }
  ];
}

function doGet() {
  var quiz = getQuizData();
var html = `
  <!DOCTYPE html>
  <html>
  <head>
    <title>SSL Quiz</title>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <style>
      body {
        font-family: Arial;
        margin: 20px;
        line-height: 1.6;
        color: #333;
      }
      .question {
        margin: 20px 0;
        padding: 20px;
        background: #f8f9fa;
        border-radius: 8px;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      }
      .option {
        margin: 10px 0;
      }
      button {
        padding: 10px 15px;
        margin: 5px;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-size: 16px;
        transition: all 0.3s ease;
      }
      button:hover {
        opacity: 0.9;
      }
      .correct {
        background: #28a745;
        color: white;
      }
      .wrong {
        background: #dc3545;
        color: white;
      }
      .explanation {
        margin-top: 20px;
        padding: 15px;
        background: #e9ecef;
        border-left: 4px solid #007bff;
        border-radius: 4px;
      }
      .next-btn {
        background: #007bff;
        color: white;
        font-weight: bold;
      }
      .study-mode {
        margin-bottom: 20px;
      }
      .study-tip {
        background: #fff3cd;
        padding: 10px;
        margin-top: 10px;
        border-radius: 4px;
      }
      .result-icon {
        font-size: 24px;
        margin-right: 10px;
      }
    </style>
  </head>
  <body>
    <h1>SSL AWS 900+ Quiz</h1>
    <div id="quiz"></div>
    <script>
      var quiz = ${JSON.stringify(quiz)};
      var currentQuestion = 0;
      var score = 0;
      
      function showQuestion() {
        var q = quiz[currentQuestion];
        var html = '<div class="question">';
        html += '<h3>Question ' + (currentQuestion + 1) + '/' + quiz.length + '</h3>';
        
        // In study mode, show explanation first
        if (studyMode) {
          html += '<div class="study-tip"><strong>Study Tip:</strong><br>' + 
                  q.explanation + '</div>';
          html += '<button onclick="showAnswerOptions()" class="next-btn">Show Answer Options</button>';
        } else {
          html += '<p>' + q.question + '</p>';
          html += '<div id="options">';
          for (var i = 0; i < q.options.length; i++) {
            html += '<div class="option"><button onclick="checkAnswer(' + i + ')">' + q.options[i] + '</button></div>';
          }
          html += '</div>';
        }
        html += '</div>';
        document.getElementById('quiz').innerHTML = html;
      }

      function showAnswerOptions() {
        var q = quiz[currentQuestion];
        var questionDiv = document.querySelector('.question');
        var optionsHtml = '<p>' + q.question + '</p><div id="options">';
        for (let i = 0; i < q.options.length; i++) {
          optionsHtml += '<div class="option"><button onclick="checkAnswer(' + i + ')">' + q.options[i] + '</button></div>';
        }
        optionsHtml += '</div>';
        questionDiv.innerHTML += optionsHtml;
      }

      function checkAnswer(choice) {
        var q = quiz[currentQuestion];
        var buttons = document.querySelectorAll('button');
        for (var i = 0; i < buttons.length; i++) {
          buttons[i].disabled = true;
        }
        
        var isCorrect = choice === q.answer;
        var resultIcon = isCorrect ? '✅' : '❌';
        
        if (isCorrect) {
          score++;
          buttons[choice].className = 'correct';
        } else {
          buttons[choice].className = 'wrong';
          buttons[q.answer].className = 'correct';
        }

        // Show explanation
        var explanationHtml = 
          '<div class="explanation">' +
            '<p><span class="result-icon">' + resultIcon + '</span>' + 
               (isCorrect ? 'Correct!' : 'Incorrect.') + '</p>' +
            '<p><strong>Your answer:</strong> ' + q.options[choice] + '</p>' +
            (!isCorrect ? '<p><strong>Correct answer:</strong> ' + q.options[q.answer] + '</p>' : '') +
            '<p><strong>Explanation:</strong> ' + q.explanation + '</p>' +
            '<button onclick="nextQuestion()" class="next-btn">Next Question</button>' +
          '</div>';
        
        document.querySelector('.question').innerHTML += explanationHtml;
      }

      // Add study mode toggle
      var studyMode = false;
      function toggleStudyMode() {
        studyMode = !studyMode;
        document.getElementById('study-toggle').textContent = 
          studyMode ? 'Switch to Quiz Mode' : 'Switch to Study Mode';
        showQuestion();
      }

      function nextQuestion() {
        currentQuestion++;
        if (currentQuestion < quiz.length) {
          showQuestion();
        } else {
          document.getElementById('quiz').innerHTML = 
            '<div class="question">' +
              '<h2>Quiz Complete!</h2>' +
              '<p>Score: ' + score + ' out of ' + quiz.length + '</p>' +
              '<button onclick="location.reload()" class="next-btn">Restart Quiz</button>' +
            '</div>';
        }
      }

      // Initialize quiz
      document.getElementById('quiz').innerHTML += 
        '<div class="study-mode">' +
          '<button id="study-toggle" onclick="toggleStudyMode()" class="next-btn">' +
            'Switch to Study Mode' +
          '</button>' +
        '</div>';
      showQuestion();
    </script>
  </body>
  </html>
`;
  return HtmlService.createHtmlOutput(html).addMetaTag('viewport', 'width=device-width, initial-scale=1').setTitle('SSL Quiz').setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
  return HtmlService.createHtmlOutput(html)
    .setTitle('SSL Quiz')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
