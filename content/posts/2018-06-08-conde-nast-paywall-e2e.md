---
title: "End-to-End Testing the Condé Nast Paywalls"
date: 2018-06-08
draft: false
canonical: https://technology.condenast.com/story/end-to-end-testing-conde-nast-paywalls
---

# End-to-End Testing the Condé Nast Paywalls

Written by Oli Treadwell

## There was an idea...

On February 1st, 2018, WIRED Editors wrote "The Next 25 Years of WIRED Start Today", announcing the launch of the WIRED paywall. Vanity Fair's Editor in Chief Radhika Jones' letter "Vanity Fair, the Future, and You" followed in April, with the launch of Vanity Fair's metered paywall. Jones writes,

> At a moment when quality journalism is not a luxury, but a necessity, your commitment will enable us to invest in our reporting, writing, photography, and video, expanding into new areas and onto new platforms, with you, our core reader and viewer, clearly in focus. We cannot do it without you.

Our team knew that Condé Nast's investment into "more breaking news, more in-depth reporting, more voices in commentary and opinion, more access to our incredible archives, and more [..] intelligent, prescient, agenda-setting journalism" meant the launch of the WIRED and Vanity Fair paywall was critical. Supporting the work on the paywall, our team of 4 developers and 2 product managers within Condé Nast's Monetization squad built a tool to run automated end-to-end test suites against our paywalls.

## ...don't forget this might be dangerous, so let's put on our mean faces.

With the goal of keeping a high standard paywall experience on WIRED and Vanity Fair, our team was aware of the potential challenges we may face. As with each of Condé Nast's technology features functionality, uptime and performance are of utmost importance.

Particular to the work on the paywalls, we knew that were the paywall to fail it would negatively impact the experience of our subscriber community. Not to lessen the importance that any paywall failures result in immediate loss of revenue for the business. Condé Nast asks our subscribed readers to support our investment in high-quality news, journalism, and media. We set about building a tool to keep that promise to our community.

## Let's talk about this plan of yours.

Prior to investigating the technology stack that we would use for this project, we established required behaviors of the to-be-built tool. By choosing these necessities, we were able to rule out numerous methodologies.

The simplest of these requirements was the project needed to check that the paywalls were behaving as expected at recurring intervals without the need for manual interaction. This goal was quickly followed by a need to alert the team building and maintaining the paywalls across our brands. This quickly ruled out any process that would require manual work, whether that was a manual quality assurance process or even a tool we would need to run ourselves from within the command line.

Another crucial factor was that we needed this tool to be up and running in days, not weeks, as development for the paywall was ongoing. For our team, this pushed us to prefer working with languages, libraries, and services that were already familiar to the engineers who would be building the tool. Our team works mostly with JavaScript, utilizing NodeJS and ReactJS, which factored into the tech stack we decided upon.

## A simple spell, but quite effective.

During the research process, we compared numerous tools, including Chromeless NodeJS library, WebDriver, Robot Framework (used by our Automation QA team), and TestCafe amongst others. We settled on the Puppeteer library. This decision was driven by a number of factors. Our team was most comfortable working with JavaScript and we had confidence in Puppeteer, which is the de facto library provided and actively worked on by the Google Chrome team. Our research leads us to conclude that working with Puppeteer provided a direct connection with the API driving headless Chrome whereas alternatives would interact with the headless browser through PhantomJS, one further layer of abstraction.

It was useful to learn from the experiences of other software engineers who shared the challenges found when developing automated end-to-end testing. The proof of concept clearly showed some of those pitfalls, giving us the chance to seek out solutions. The tools for javascript end-to-end testing continue to improve and new tools make it a more enjoyable process; even so, teams may decide to instead focus on manual quality assurance and unit testing. Condé Nast agreed that this project warranted the additional effort to overcome those challenges.

Our proof of concept for this project also illuminated the strengths we found with our chosen tools. Using tools that our team worked with previously: keeping with Javascript, Mocha for testing, and Chai expect for our assertions.

Puppeteer, Mocha, and Chai are the primary tools for this project. Puppeteer "is a Node library which provides a high-level API to control headless Chrome or Chromium over the DevTools Protocol." Puppeteer enabled our tests to do many of the actions that a user can do manually within the browser.

To satisfy our requirement of building a tool that runs our test suite at recurring intervals, we set the test suite to run within a Jenkins build that is kicked off every 30 minutes, or if the test suite build is unstable or fails. Of particular value was the Test Results Analyzer Plugin, which facilitated finding recurring patterns within failing tests. This visual representation made it easy to determine if failures were due to changes on The New Yorker, WIRED, or Vanity Fair rather than potential instability occurring while that test suite build was running. Code deployments to the brand sites caused hiccups in our test suites, though being able to drill down in a specific assertion across numerous builds reduced anxiety throughout the organization when we could see the same assertion come back "Pass" on the following test build.

*Jenkins' Test Result Analyzer Plugin Table*

Datadog and Slack comprise our primary reporting and alerting tools from which folks from across Condé Nast could easily see if the test suites were coming back with regular failing tests. Both Jenkins and Datadog are integrated into our Condé Nast Slack team and so give us build-by-build feedback in a convenient and actionable manner.

## Well, if you consider failure experience.

After moving our tests into Continuous Integration, we noticed tests failing that had passed during recent test suite runs. It turned out some of these were due to the ongoing development of the underlying paywall features themselves, while others were the result of inconsistent behavior within our test suite, which we set out to correct. By implementing ECMAScript 2017's `async`/`await` syntax, Martin Fowler's Page Object design pattern, and Puppeteer's delay and focus functions, we improved the reliability for our test suite on a run-by-run basis.

*ECMAScript 2017's async await functions within paywall end-to-end tests*

We adopted ECMAScript 2017's async/await syntax to avoid the pitfalls of asynchronous javascript and testing. This gives us a synchronous interface for making our assertions, which made JavaScript testing easier for our team.

*Page Object Diagram (credit Martin Fowler)*

The Test Suite makes use of the Page Object design pattern, credit and thanks to Martin Fowler. With this pattern, all interactions through Puppeteer were extracted into their own objects. Each object represented a single page on the site. This meant that each page's object included an API for all interactions with and assertions about the page. It was a marked improvement in our test suites' maintainability. With the Page Object pattern, the assertions and the behavior were cleanly abstracted from each other. Additional improvements and refactorings were not tied directly to our assertions, reducing potential frustrations.

## So this is it? It's all been leading to this.

These tests proved immediately valuable for the team working on the paywall features. The tests simulate a user navigating the website from article to article, checking that the paywall features appear as expected. Eventually, this simulated user reaches the final paywall barrier, purchases a subscription, authenticates as an entitled account holder, and finally views a now paywall-free experience.

We built a framework that supports a quality user experience for our paywalls by running our test suites on a schedule within a Continuous Integration environment against the production websites for The New Yorker, WIRED, and Vanity Fair. Despite some challenges, our work quickly communicated times when changes were causing the paywall to work in unexpected ways.

Our team made impactful contributions to the rollout of the paywalls, and we overcame a number of challenges associated with end-to-end testing in JavaScript. We're invigorated by our experience with end to end testing. Have you worked with end-to-end testing? Puppeteer? Any other thoughts about this post? We'd love to hear from you! Get @ us on Twitter: @CondeNastTech
