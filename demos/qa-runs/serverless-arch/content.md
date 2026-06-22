# Serverless Image Processing on AWS

---

## Slide 01: Title
type: title

### heading
Serverless Image Processing on AWS

### subtitle
A reference architecture for ingesting, analyzing, and serving images at scale — without managing a single server.

---

## Slide 02: The Problem
type: content

### heading
Why Serverless for Media

### body
- Image workloads are spiky — traffic arrives in unpredictable bursts
- Provisioning for peak wastes money; provisioning for average drops requests
- Pay-per-request services absorb the spikes automatically
- The team should write handlers, not babysit fleets

---

## Slide 03: Architecture
type: content

### heading
End-to-End Architecture

### diagram
type: aws
caption: Event-driven pipeline — upload to delivery, fully managed
Users upload images to an Amazon S3 bucket.
The S3 upload event triggers an AWS Lambda function.
Lambda calls Amazon Rekognition for labels and moderation.
Lambda writes the metadata and labels to Amazon DynamoDB.
Amazon CloudFront serves the processed images back to users.

---

## Slide 04: Request Flow
type: content

### heading
What Happens on Upload

### diagram
type: flowchart
caption: The processing decision path for a single upload
A user uploads an image.
The system validates the file type and size.
If invalid, reject the upload and return an error.
If valid, store the original and trigger analysis.
Rekognition returns labels and a moderation verdict.
If the content is flagged, quarantine it for review.
Otherwise, publish the image to the CDN.

---

## Slide 05: Why It Scales
type: content

### heading
Scales to Zero, Scales to Peak

### body
- Every component is pay-per-use — idle cost trends to zero
- Lambda concurrency absorbs bursts without pre-warming fleets
- DynamoDB on-demand matches throughput to actual traffic
- CloudFront caches at the edge, shielding the origin

---

## Slide 06: Cost Profile
type: content

### heading
The Numbers Behind It

### body
- No idle servers means no idle bill
- Cost grows linearly and predictably with real usage
- Edge caching cuts origin requests by the majority of traffic

### chart
type: bar
labels: Idle, Low, Average, Peak
Monthly cost ($, serverless): 2, 40, 180, 520
Monthly cost ($, always-on fleet): 600, 600, 700, 900

---

## Slide 07: Closing
type: title

### heading
Build the Pipeline, Not the Plumbing

### subtitle
Thank you — questions welcome.

---
