<div align="center" style="display: flex; flex-direction: column; justify-content: center; margin-top: 16px; margin-bottom: 16px;">
    <a style="align-self: center" href="https://launchflow.com/#gh-dark-mode-only" target="_blank">
        <img  height="auto" width="270" src="https://storage.googleapis.com/launchflow-public-images/launchflow-logo-dark.png#gh-dark-mode-only">
    </a>
    <a style="align-self: center" href="https://launchflow.com/#gh-light-mode-only" target="_blank">
        <img  height="auto" width="270" src="https://storage.googleapis.com/launchflow-public-images/launchflow-logo-light.svg#gh-light-mode-only">
    </a>
    <div style="display: flex; align-content: center; gap: 4px; justify-content: center;   border-bottom: none;">
        <h2 style="margin-top: 0px; margin-bottom: 0px; border-bottom: none; text-align: start;">
            Generate, edit, and deploy Python APIs in your browser
        </h2>
    </div>
</div>
<div style="text-align: center;" align="center">

<h3>
Try it now: <a href="https://ai.launchflow.com" target="_blank">ai.launchflow.com</a>
</h3>
</div>

## Introduction

This repo is a fork of [Bolt.new](https://github.com/stackblitz/bolt.new) that has been modified to focus on Python APIs.

We are just experimenting with the idea of generating, editing, and deploying Python APIs in the browser.

**This project is a proof of concept and is not intended for production use.**

## Background on Bolt.new
The original Bolt implementation is focused on generating and running node.js apps in the browser using WebContainers. WebContainers partly support Python using wasm, but most Python libraries are not available.

This fork does not use WebContainers and instead deploys Python APIs to a serverless environment hosted on LaunchFlow Cloud.

## Contact
If you have any questions or feedback, please reach out to us at [team@launchflow.com](mailto:team@launchflow.com) or open an issue in this repo.