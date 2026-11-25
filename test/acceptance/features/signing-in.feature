Feature: Signing in and out
  Members sign in to see their timeline, and sign out when they are done.

  How the app answers each kind of sign-in (unconfirmed address, unknown account,
  wrong password) is covered by the functional tests. Here we check what the member sees.

  Scenario: A returning member is welcomed back
    Given Anna is a member who has signed in before
    When she signs in
    Then she is welcomed back

  Scenario: A member who mistypes her password stays signed out
    Given Anna is a member
    When she signs in with the wrong password
    Then she is told her email address or password is incorrect
    And she is still signed out

  Scenario: A visitor who is not signed in is asked to sign in
    Given Anna is not signed in
    When she visits Postboard
    Then she is asked to sign in

  Scenario: A member signs out
    Given Anna is signed in
    When she signs out
    Then she is asked to sign in
