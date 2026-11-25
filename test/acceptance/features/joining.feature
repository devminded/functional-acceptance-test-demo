Feature: Joining as a new member
  Newcomers register, confirm their email address and sign in.

  This is the one journey that walks all the way through the user interface,
  because here the journey itself is the behaviour under test.

  Scenario: A newcomer registers and gets started
    Given Anna has never had an account with us
    When she registers
    And she confirms her email address
    Then she can sign in
    And she is greeted as a new member
