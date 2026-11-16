# Civics grading eval: test cases

65 fake learner answers, each one the phone can't settle on its own, so the AI decides. "Should count?" is the label the models are scored against. Generated from cases.json; edit that file, then run `npm run evals:civics:cases`.

Right answers: 33 · wrong or not an answer: 32 · reviewed: 0 of 65

## other-words

| Id | Question | Learner said | Should count? | Why | Official answer |
| --- | --- | --- | --- | --- | --- |
| c01 | Why does the flag have 13 stripes? | because of the first thirteen colonies | Yes | "first" means "original" | (Because there were) 13 original colonies / (Because the stripes) represent the original colonies |
| c02 | What is the economic system of the United States? | a capitalist system | Yes | capitalist = capitalism | Capitalism / Free market economy |
| c03 | Name one power of the U.S. Congress. | they make the laws | Yes | makes laws = writes laws | Writes laws / Declares war / Makes the federal budget |
| c04 | What does the President’s Cabinet do? | they give advice to the president | Yes | advises the President | Advises the President (of the United States) |
| c05 | What is the rule of law? | nobody is over the law even the president | Yes | no one is above the law | Everyone must follow the law. / Leaders must obey the law. / Government must obey the law. / No one is above the law. |
| c06 | How many U.S. senators are there? | a hundred | Yes | 100 | One hundred (100) |
| c07 | How long is a term for a U.S. senator? | half a dozen years | Yes | six years, said another way | Six (6) years |
| c08 | Who is Commander in Chief of the U.S. military? | the president of the country | Yes | the President | The President (of the United States) |
| c09 | What did the civil rights movement do? | they fought so black people have the same rights as everybody | Yes | fought to end racial discrimination | Fought to end racial discrimination |
| c10 | Why did the United States enter the Vietnam War? | to stop the communists from spreading | Yes | to stop the spread of communism | To stop the spread of communism |
| c11 | What was the Great Depression? | a long time when the economy was very bad and many people had no job | Yes | longest economic recession | Longest economic recession in modern history |
| c12 | What is Memorial Day? | a day to remember the soldiers who died in the wars | Yes | honors soldiers who died in military service | A holiday to honor soldiers who died in military service |
| c13 | What does the judicial branch do? | the courts decide if a law follow the constitution | Yes | decides if a law goes against the Constitution | Reviews laws / Explains laws / Resolves disputes (disagreements) about the law / Decides if a law goes against the (U.S.) Constitution |
| c14 | Why do U.S. representatives serve shorter terms than U.S. senators? | so they listen more to what the people want right now | Yes | to more closely follow public opinion | To more closely follow public opinion |
| c15 | What do we show loyalty to when we say the Pledge of Allegiance? | to the American flag | Yes | the flag | The United States / The flag |
| c16 | What territory did the United States buy from France in 1803? | the Louisiana purchase | Yes | Louisiana | Louisiana Territory / Louisiana |
| c17 | Who wrote the Declaration of Independence? | Thomas Jeferson | Yes | Jefferson, misspelled | (Thomas) Jefferson |
| c18 | When did all women get the right to vote? | around 1920 with a new amendment | Yes | 1920 / the 19th Amendment | 1920 / After World War I / (With the) 19th Amendment |

## broken-english

| Id | Question | Learner said | Should count? | Why | Official answer |
| --- | --- | --- | --- | --- | --- |
| c19 | Who vetoes bills? | presiden | Yes | speech recognition dropped the last letter of "president" | The President (of the United States) |
| c20 | What are the two parts of the U.S. Congress? | senate and the house of the representants | Yes | Senate and House of Representatives | Senate and House (of Representatives) |
| c21 | Name one war fought by the United States in the 1800s. | civil war between north and south | Yes | Civil War | War of 1812 / Mexican-American War / Civil War / Spanish-American War |
| c22 | What is the capital of the United States? | washington d c | Yes | Washington, D.C., letters split by speech recognition | Washington, D.C. |
| c23 | Why does each state have two senators? | so the small states have the same voice | Yes | equal representation for small states | Equal representation (for small states) / The Great Compromise (Connecticut Compromise) |
| c24 | What is the form of government of the United States? | a republic country | Yes | republic | Republic / Constitution-based federal republic / Representative democracy |
| c25 | How many seats are on the Supreme Court? | nine judge | Yes | nine | Nine (9) |
| c26 | Martin Luther King, Jr. is famous for many things. Name one. | he fight for the civil rights for black people | Yes | fought for civil rights | Fought for civil rights / Worked for equality for all Americans / Worked to ensure that people would “not be judged by the color of their skin, but by the content of their character” |
| c27 | Who lived in America before the Europeans arrived? | the native people who was here first | Yes | Native Americans, in broken English | American Indians / Native Americans |

## wrong

| Id | Question | Learner said | Should count? | Why | Official answer |
| --- | --- | --- | --- | --- | --- |
| c28 | How many U.S. senators are there? | two for each state | No | two per state, not the total of 100 | One hundred (100) |
| c29 | Who vetoes bills? | the Congress | No | the President vetoes bills | The President (of the United States) |
| c30 | What are the two parts of the U.S. Congress? | the Senate and the Supreme Court | No | the Supreme Court is not part of Congress | Senate and House (of Representatives) |
| c31 | How long is a term for a member of the House of Representatives? | four years | No | two years | Two (2) years |
| c32 | Who wrote the Declaration of Independence? | George Washington | No | Thomas Jefferson | (Thomas) Jefferson |
| c33 | What is the highest court in the United States? | the federal court | No | the Supreme Court | Supreme Court |
| c34 | When was the Declaration of Independence adopted? | 1787 | No | July 4, 1776; 1787 is the Constitution | July 4, 1776 |
| c35 | Name the U.S. war between the North and the South. | the Revolutionary War | No | the Civil War | The Civil War |
| c36 | Who was president during the Great Depression and World War II? | Truman | No | Franklin Roosevelt | (Franklin) Roosevelt |
| c37 | What is the economic system of the United States? | democracy | No | a democracy is a form of government, not an economic system | Capitalism / Free market economy |
| c38 | Why does the flag have 50 stars? | for the 50 presidents | No | one star for each state | (Because there is) one star for each state / (Because) each star represents a state / (Because there are) 50 states |
| c39 | Who does a U.S. senator represent? | the president | No | the people of their state | Citizens of their state / People of their state |
| c40 | What is the purpose of the 10th Amendment? | it gives freedom of speech | No | that is the First Amendment | (It states that the) powers not given to the federal government belong to the states or to the people. |
| c41 | If the president can no longer serve, who becomes president? | the Speaker of the House | No | the Vice President | The Vice President (of the United States) |
| c42 | Who is Commander in Chief of the U.S. military? | the general of the army | No | the President | The President (of the United States) |
| c43 | What did the Emancipation Proclamation do? | it ended the Civil War | No | it freed the slaves | Freed the slaves / Freed slaves in the Confederacy / Freed slaves in the Confederate states / Freed slaves in most Southern states |
| c44 | Why did the United States enter the Persian Gulf War? | to stop communism | No | to force the Iraqi military from Kuwait | To force the Iraqi military from Kuwait |
| c45 | Name one power that is only for the states. | print money | No | printing money is a federal power | Provide schooling and education / Provide protection (police) / Provide safety (fire departments) / Give a driver’s license / Approve zoning and land use |
| c46 | Name one power that is only for the federal government. | give a driver license | No | driver's licenses are a state power | Print paper money / Mint coins / Declare war / Create an army / Make treaties / Set foreign policy |
| c47 | What founding document was written in 1787? | the Declaration of Independence | No | the Constitution | (U.S.) Constitution |
| c48 | The President of the United States is elected for how many years? | two terms | No | four years; two terms is the limit | Four (4) years |

## how-many

| Id | Question | Learner said | Should count? | Why | Official answer |
| --- | --- | --- | --- | --- | --- |
| c49 | Name three national U.S. holidays. | Christmas and Thanksgiving | No | only two holidays for "name three" | New Year’s Day / Martin Luther King, Jr. Day / Presidents Day (Washington’s Birthday) / Memorial Day / Juneteenth / Independence Day / Labor Day / Columbus Day / Veterans Day / Thanksgiving Day / Christmas Day |
| c50 | What are two Cabinet-level positions? | Secretary of State | No | only one position for "two" | Attorney General / Secretary of Agriculture / Secretary of Commerce / Secretary of Education / Secretary of Energy / Secretary of Health and Human Services / Secretary of Homeland Security / Secretary of Housing and Urban Development / Secretary of the Interior / Secretary of Labor / Secretary of State / Secretary of Transportation / Secretary of the Treasury / Secretary of Veterans Affairs / Secretary of War (Defense) / Vice-President / Administrator of the Environmental Protection Agency / Administrator of the Small Business Administration / Director of the Central Intelligence Agency / Director of the Office of Management and Budget / Director of National Intelligence / United States Trade Representative |
| c51 | What are three rights of everyone living in the United States? | freedom of speech freedom of religion and the right to vote | No | voting is for citizens only, so only two of the three count | Freedom of expression / Freedom of speech / Freedom of assembly / Freedom to petition the government / Freedom of religion / The right to bear arms |
| c52 | Name two promises that new citizens make in the Oath of Allegiance. | obey the laws and defend the constitution | Yes | two promises, in other words | Give up loyalty to other countries / Defend the (U.S.) Constitution / Obey the laws of the United States / Serve in the military (if needed) / Serve (help, do important work for) the nation (if needed) / Be loyal to the United States |
| c53 | There were 13 original states. Name five. | New York Virginia Georgia Texas Maryland | No | Texas was not one of the 13, so only four | New Hampshire / Massachusetts / Rhode Island / Connecticut / New York / New Jersey / Pennsylvania / Delaware / Maryland / Virginia / North Carolina / South Carolina / Georgia |
| c54 | Name three national U.S. holidays. | the Fourth of July Labor Day and Memorial Day | Yes | Fourth of July = Independence Day | New Year’s Day / Martin Luther King, Jr. Day / Presidents Day (Washington’s Birthday) / Memorial Day / Juneteenth / Independence Day / Labor Day / Columbus Day / Veterans Day / Thanksgiving Day / Christmas Day |
| c55 | What are two examples of civic participation in the United States? | vote and join a party | Yes | vote; join a political party | Vote / Run for office / Join a political party / Help with a campaign / Join a civic group / Join a community group / Give an elected official your opinion (on an issue) / Contact elected officials / Support or oppose an issue or policy / Write to a newspaper |

## not-an-answer

| Id | Question | Learner said | Should count? | Why | Official answer |
| --- | --- | --- | --- | --- | --- |
| c56 | Who signs bills to become laws? | I don't know | No | no answer | The President (of the United States) |
| c57 | What is the rule of law? | can you repeat the question please | No | asks to repeat; no answer | Everyone must follow the law. / Leaders must obey the law. / Government must obey the law. / No one is above the law. |
| c58 | What is Independence Day? | my birthday is in July | No | off topic | A holiday to celebrate U.S. independence (from Britain) / The country’s birthday |

## personal-info

| Id | Question | Learner said | Should count? | Why | Official answer |
| --- | --- | --- | --- | --- | --- |
| c59 | Who elects U.S. senators? | the citizens of my state call me at 617 555 0199 | Yes | citizens from their state; the phone number must be removed | Citizens from their state |
| c60 | Why is it important to pay federal taxes? | because it is the law my email is maria.fake@example.com | Yes | required by law; the email must be removed | Required by law / All people pay to fund the federal government / Required by the (U.S.) Constitution (16th Amendment) / Civic duty |
| c61 | What is the name of the national anthem? | the star spangled banner my a number is A123456789 | Yes | right answer; the A-number must be removed | The Star-Spangled Banner |

## hedging

| Id | Question | Learner said | Should count? | Why | Official answer |
| --- | --- | --- | --- | --- | --- |
| c62 | Who was the United States’ main rival during the Cold War? | England France or Russia | No | a list of guesses, not one answer | Soviet Union / USSR / Russia |
| c63 | What is the highest court in the United States? | the Supreme Court or the Congress | No | a list of guesses, one of them wrong | Supreme Court |
| c64 | Who was the United States’ main rival during the Cold War? | Germany or the Soviet Union I think Germany | No | the final answer is Germany | Soviet Union / USSR / Russia |

## not-english

| Id | Question | Learner said | Should count? | Why | Official answer |
| --- | --- | --- | --- | --- | --- |
| c65 | Who signs bills to become laws? | el presidente | No | answered in Spanish; the test must be answered in English | The President (of the United States) |
