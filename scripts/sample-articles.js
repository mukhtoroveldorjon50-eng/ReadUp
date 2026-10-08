// Sample content used by seed-demo.js (original texts written for this project).
const mcq = (q, options, answer, explanation) => ({ type: 'mcq', q, options, answer, explanation });
const tfng = (q, answer, explanation) => ({ type: 'tfng', q, answer, explanation });
const gap = (q, answer, explanation) => ({ type: 'gap', q, answer, explanation });

module.exports = [
  {
    title: 'Why Sleep Matters More Than You Think',
    level: 'B1',
    topic: 'Health',
    summary: 'Scientists say sleep is as important as food and exercise. Here is what happens while you rest.',
    body: `Many people see sleep as a waste of time. They stay up late to study, work or watch videos, and they believe that they can catch up at the weekend. However, scientists now agree that sleep is just as important for our health as food and exercise.

While we sleep, the brain is surprisingly busy. It moves the things we learned during the day into long-term memory, and it clears away waste that builds up while we are awake. This is why students who sleep well after studying often remember more than students who study all night.

Sleep also affects our mood. People who do not get enough rest are more likely to feel stressed, angry or sad. In addition, they get ill more often, because the body repairs itself and fights infections during the night.

Most adults need between seven and nine hours of sleep, while teenagers need even more. Experts suggest a few simple habits: go to bed at the same time every day, avoid screens for an hour before bed, and keep your bedroom dark and quiet. Small changes like these can make a big difference to how you feel and how well you learn.`,
    body_simple: `Many people think sleep is a waste of time. They stay up late to study or work. But scientists say sleep is as important as food and exercise.

When we sleep, the brain is busy. It saves what we learned today in our long-term memory. It also cleans itself. Students who sleep well after studying remember more.

Sleep also changes how we feel. People who sleep too little feel more stressed, angry or sad. They also get ill more often, because the body fixes itself at night.

Adults need seven to nine hours of sleep. Teenagers need more. Go to bed at the same time every day, do not use screens before bed, and keep your room dark and quiet.`,
    glossary: [
      { word: 'long-term memory', definition: 'the part of the brain that keeps information for a long time', example: 'The brain moves new facts into long-term memory while we sleep.', translation: '' },
      { word: 'stressed', definition: 'feeling worried and unable to relax', example: 'People who sleep badly often feel stressed.', translation: '' },
      { word: 'infection', definition: 'an illness caused by germs', example: 'The body fights an infection during the night.', translation: '' },
      { word: 'habit', definition: 'something you do regularly, often without thinking', example: 'Going to bed at the same time is a good habit.', translation: '' },
      { word: 'surprisingly', definition: 'in a way that you do not expect', example: 'The sleeping brain is surprisingly busy.', translation: '' },
      { word: 'catch up', definition: 'to do something you missed earlier', example: 'He tried to catch up on sleep at the weekend.', translation: '' },
    ],
    lang_quiz: [
      mcq('Scientists now agree ____ sleep is as important as food.', ['that', 'what', 'who', 'which'], 0, '"Agree that + clause" reports what scientists believe.'),
      gap('Students who sleep well ____ (remember) more than students who study all night.', 'often remember|remember', 'Present simple is used for general facts.'),
      mcq('Which word means "feeling worried and unable to relax"?', ['rested', 'stressed', 'quiet', 'dark'], 1, 'Stressed describes worry and pressure.'),
      mcq('People who do not get enough rest ____ likely to feel angry.', ['is more', 'are more', 'be more', 'are most'], 1, 'Plural subject "people" takes "are"; "more likely" compares.'),
      gap('Avoid screens for an hour ____ bed.', 'before', '"Before" shows the order in time.'),
      mcq('"They can catch up at the weekend." Here, "catch up" means:', ['catch a ball', 'do something that was missed', 'become faster', 'meet friends'], 1, 'Catch up on sleep = sleep extra to make up for lost sleep.'),
    ],
    comp_quiz: [
      mcq('What is the main idea of the article?', ['Sleep is a waste of time', 'Sleep is as important as food and exercise', 'Teenagers should study at night', 'Screens are dangerous'], 1, 'The first paragraph states this clearly.'),
      tfng('The brain does nothing while we sleep.', 'False', 'The text says the brain is "surprisingly busy".'),
      tfng('Students who study all night always get the best marks.', 'Not given', 'The text only says well-rested students remember more; it says nothing about "best marks".'),
      mcq('According to the article, why do people who sleep little get ill more often?', ['They eat badly', 'The body repairs itself and fights infections at night', 'They exercise too much', 'They drink less water'], 1, 'See paragraph three.'),
      tfng('Teenagers need more sleep than adults.', 'True', 'The text says teenagers "need even more".'),
      mcq('Which habit does the article NOT recommend?', ['Same bedtime every day', 'Screens before bed', 'A dark bedroom', 'A quiet bedroom'], 1, 'It says to avoid screens for an hour before bed.'),
    ],
  },
  {
    title: 'The Market on Saturday Morning',
    level: 'A2',
    topic: 'Culture',
    summary: 'A short story about a busy town market and the people who work there.',
    body: `Every Saturday morning, Maria goes to the market in her town. It opens at seven o'clock, but she likes to arrive early because the fruit is fresh and the streets are quiet.

First, she buys vegetables from Mr Karim. He has a small stall near the fountain. Today, he is selling red tomatoes, green peppers and big yellow lemons. "Good morning, Maria!" he says. "These tomatoes are very sweet." Maria smiles and takes one kilo.

Next, she walks to the bakery stall. The smell of warm bread is wonderful. She buys two loaves and a cake for her sister's birthday. The baker puts everything in a paper bag.

At nine o'clock the market is full of people. Children are running between the stalls, and a man is playing music on his guitar. Maria is tired but happy. She does not need a supermarket. For her, the market is the best part of the week.`,
    body_simple: '',
    glossary: [
      { word: 'stall', definition: 'a small table or shop where people sell things outside', example: 'He has a small stall near the fountain.', translation: '' },
      { word: 'fresh', definition: 'new and not old; just picked or made', example: 'The fruit is fresh in the morning.', translation: '' },
      { word: 'loaf', definition: 'a whole piece of bread', example: 'She buys two loaves of bread.', translation: '' },
      { word: 'fountain', definition: 'a structure that sends water into the air', example: 'The stall is near the fountain.', translation: '' },
    ],
    lang_quiz: [
      mcq('Maria ____ to the market every Saturday.', ['go', 'goes', 'going', 'is go'], 1, 'Present simple, third person singular: she goes.'),
      gap('She buys two ____ of bread. (one whole piece = loaf)', 'loaves', 'The plural of "loaf" is "loaves".'),
      mcq('Mr Karim is selling red tomatoes, green peppers ____ big yellow lemons.', ['but', 'or', 'and', 'so'], 2, '"And" joins the last item in a list.'),
      mcq('The market is full ____ people at nine o\'clock.', ['of', 'with', 'in', 'at'], 0, '"Full of" is the usual collocation.'),
      gap('Children ____ running between the stalls.', 'are', 'Present continuous: are + verb-ing for actions happening now.'),
    ],
    comp_quiz: [
      mcq('When does the market open?', ['At six', 'At seven', 'At nine', 'At ten'], 1, 'The first paragraph says seven o\'clock.'),
      tfng('Maria buys vegetables from Mr Karim.', 'True', 'See paragraph two.'),
      mcq('Why does Maria buy a cake?', ['It is for her sister\'s birthday', 'She is hungry', 'It is cheap', 'The baker is her friend'], 0, 'See paragraph three.'),
      tfng('Maria shops at the supermarket every week.', 'False', 'She "does not need a supermarket".'),
      tfng('The baker is a woman.', 'Not given', 'The text does not say if the baker is a man or a woman.'),
    ],
  },
  {
    title: 'The Rise of Remote Work',
    level: 'B2',
    topic: 'Business',
    summary: 'Working from home was once rare. Now millions of people do it. What are the benefits and the risks?',
    body: `A decade ago, working from home was a privilege granted to a lucky few. Today, millions of employees around the world split their week between the office and their living room, and many have abandoned the daily commute altogether.

Supporters of remote work point to a number of advantages. Employees save hours of travel time and can arrange their day around family commitments. Companies, meanwhile, can hire talented people regardless of where they live, and some have reduced costs by renting smaller offices.

Nevertheless, the shift has not been entirely smooth. Managers sometimes struggle to monitor progress, and new recruits can feel isolated when they never meet their colleagues in person. Informal conversations by the coffee machine, which often spark creative ideas, are hard to reproduce on a video call.

As a result, many organisations are adopting a hybrid model, in which staff come into the office two or three days a week. Whether this compromise will last remains to be seen, but one thing is clear: the traditional nine-to-five office routine will never be quite the same again.`,
    body_simple: '',
    glossary: [
      { word: 'commute', definition: 'the regular journey between home and work', example: 'Many people have abandoned the daily commute altogether.', translation: '' },
      { word: 'abandon', definition: 'to stop doing or using something completely', example: 'Some companies have abandoned large offices.', translation: '' },
      { word: 'isolated', definition: 'feeling alone and separate from other people', example: 'New recruits can feel isolated at home.', translation: '' },
      { word: 'hybrid', definition: 'made of two different things combined', example: 'A hybrid model mixes office days and home days.', translation: '' },
      { word: 'compromise', definition: 'an agreement in which each side gives up something', example: 'The hybrid model is a compromise between two ways of working.', translation: '' },
    ],
    lang_quiz: [
      mcq('Millions of employees ____ their week between the office and home.', ['split', 'splits', 'splitting', 'has split'], 0, 'Plural subject, present simple: split.'),
      mcq('Which linking word shows contrast? "Nevertheless, the shift has not been smooth."', ['In addition', 'For example', 'However / Nevertheless', 'Therefore'], 2, '"Nevertheless" introduces a contrasting idea.'),
      gap('Companies can hire talented people ____ of where they live. (without caring about)', 'regardless', '"Regardless of" means "without being affected by".'),
      mcq('"A privilege granted to a lucky few" is an example of:', ['active voice', 'passive voice (reduced)', 'question form', 'conditional'], 1, '"(which was) granted" is a reduced passive clause.'),
      mcq('"Whether this compromise will last remains to be seen" means:', ['It is certain to last', 'It will not last', 'We do not know yet', 'We can see it now'], 2, '"Remains to be seen" = still unknown.'),
      gap('As a ____, many organisations are adopting a hybrid model.', 'result', '"As a result" shows a consequence.'),
    ],
    comp_quiz: [
      mcq('What is the writer\'s main purpose?', ['To persuade people to quit their jobs', 'To discuss benefits and problems of remote work', 'To explain how to use video calls', 'To compare two companies'], 1, 'The text gives advantages, then problems, then a possible solution.'),
      tfng('Remote work has helped some companies reduce costs.', 'True', 'Paragraph two: "some have reduced costs by renting smaller offices".'),
      tfng('All managers prefer remote work.', 'False', 'Paragraph three says managers sometimes struggle to monitor progress.'),
      mcq('Why are informal conversations mentioned?', ['They waste time', 'They can spark creative ideas and are hard to reproduce online', 'They are banned at work', 'They only happen at home'], 1, 'See paragraph three.'),
      tfng('Most companies have now returned to five days in the office.', 'Not given', 'The text only says many are choosing hybrid models.'),
      mcq('What does "hybrid model" mean in the article?', ['Always work at home', 'Always work in the office', 'Some days at the office, some days at home', 'Work in two companies'], 2, 'Staff come in two or three days a week.'),
    ],
  },
];
