Feature: Sharing posts
  Members share short posts, and everyone who is signed in sees them on the timeline.

  Scenario: A member shares a post
    Given Anna is signed in
    When she shares a post
    Then her post is on the timeline

  Scenario: A member sees what others have shared
    Given Ben has shared a post
    And Anna is signed in
    When she visits Postboard
    Then she sees the post Ben shared
