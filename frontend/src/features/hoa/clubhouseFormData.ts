export type ClubhouseFormSection = {
  id: string;
  title: string;
  content: string;
};

export const CLUBHOUSE_FORM_INTRO = `Silverleaf Reserve Homeowners Association, Inc.
Clubhouse Reservation Application and Agreement

I, the undersigned owner or legal tenant of Silverleaf Reserve Homeowners Association, do hereby make application and agree to rent and use the clubhouse during the requested reservation block.

Available reservation blocks:
- Monday through Friday: 9AM-2PM (Block 1) or 5PM-10:59PM (Block 2)
- Saturday and Sunday: 10AM-3PM (Block 1) or 5PM-10:59PM (Block 2)`;

export const CLUBHOUSE_FORM_SECTIONS: ClubhouseFormSection[] = [
  {
    id: "acknowledgements",
    title: "Agreement Acknowledgements",
    content: `By signing this agreement, I acknowledge and agree to the following:
- The homeowner must be current in all association dues at the time of signing this agreement as well as at the time the clubhouse will be utilized.
- To remain on-site for the full duration of rental.
- A rental fee of $250.00 and a separate security deposit of $250.00, of which both must be made payable to Silverleaf Reserve Homeowners Association, Inc. at the time of application.
- The security deposit, minus any costs for damage, will be refunded within 30 days, after a "walk through" of the facility has been completed.
- If cancellation occurs 72-hours or more in advance of the scheduled date of use, the rental fee and security deposit will be returned in full. If cancellation occurs less than 72 hours in advance of the scheduled date of use, the rental fee will be forfeited; however, the security deposit will be returned in full.
- All reservations are subject to the approval of Silverleaf Reserve Homeowners Association HOA Board of Directors, or their assigned representative. The rental facility will only be rented to residents in good standing.
- The Silverleaf Reserve Homeowners Association reserves the right to cancel a reservation in the event that the clubhouse suffers damage or a system failure that cannot be repaired in time for the scheduled use. In the event of such a cancellation, the rental fee and security deposit will be returned in full.
- The clubhouse is available between the hours of 9:00 a.m. and 10:59PM during the week and 10:00 a.m. and 10:59PM during the weekend. Clean-up must be completed and all guests must exit the clubhouse by 11:59 p.m., at which time the alarm system will be automatically activated. The undersigned is responsible for fees charged by Law Enforcement and alarm monitoring company for setting off the alarm after activation.
- The clubhouse rental includes the exclusive use of the main room and the kitchen area of the clubhouse during the approved hours of scheduled use. The pool and bathrooms will remain open to the community and their guests.
- The actions of members and guests are video monitored at all times, while inside or outside of the Meadow at Crossprairie clubhouse, with the exception of the restroom facilities.
- The Meadow at Crossprairie HOA has the right to have a member of the Board of Directors, a Committee Member, management staff member, security guard or guards, or law enforcement officers to be present or visit the clubhouse during the rental period. I agree to pay the cost of such personnel.
- (initial here) .`
  },
  {
    id: "usage-rules",
    title: "Rules of Usage",
    content: `To adhere to the Rules of Usage and Rules for Cleanup, stated below:
- The person signing this application/agreement assumes full responsibility for the conduct and personal injury liability of self and all guests.
- Parking is restricted to designated areas only. In the event this rule is violated, the undersigned agrees to pay actual repair costs to be posted to his/her account, should damages exceed the amount of the security deposit.
- Children under the age of 18 will be supervised by an adult at all times.
- Music and noise will be limited to a level that does not create a disturbance to homeowners.
- The nature of the events will be family oriented. Adult content is prohibited.
- All clubhouse doors will remain closed to avoid excessive air conditioning costs, entry of flies/pests and the entry of non-authorized persons.
- If alcoholic beverages are brought onto the premises for consumption by self and/or guests during the rental period, the undersigned takes full responsibility for the conduct of any person consuming alcohol, that no alcohol will be sold on the premises, that no alcohol will be served to minors or intoxicated persons, and that all alcoholic beverages will be removed immediately following the event for which the clubhouse is rented.
- The following items are prohibited on the premises at all times: Fireworks, Firearms, Tobacco Products, Smoking, Gambling, Pets (except for disability assistance), Confetti, Rice, Glitter, and glass containers.
- Owners can be charged for unauthorized usage of the clubhouse. Unauthorized usage of the clubhouse are gatherings consisting of 6 or more people that were not previously booked with the association under the rental agreement.
- Music: Live music or D.J.'s are permitted with the understanding that music volume must not be carried outside the clubhouse area. Music will end at 10 pm.
- Decorations: Must be hung using tape, thumbtacks or push pins only. No surface piercing items (staples, nails, etc.) may be used to hang decorations.
- Pool deck furniture must not be removed from the pool deck.
- Open flames are prohibited except for decorative candles.
- Personal barbeque equipment is not allowed.
- If helium balloons are used, and they are caught up in the ceiling, they must be removed.
- Bounce houses, water balloons, confetti, food trucks and recreational equipment are not allowed.
- No animals of any kind (except registered service animals).`
  },
  {
    id: "cleanup",
    title: "Rules for Clean Up",
    content: `1. All personal items (food, beverages, decorations, etc.) must be removed from the premises immediately following the event and not later than 11:59 p.m.
2. All trash will be bagged and taken off premises by the renter.
3. Any movement of furniture, including tables and chairs shall be returned to its original position.
4. All lights in the main area, kitchen and restrooms will be turned off prior to leaving the building.
5. All clubhouse doors will be closed/locked prior to leaving the building.
6. The undersigned agrees to notify a member of the Board of Directors or the management company of any problems encountered and/or any damages to the clubhouse or grounds that occur during the scheduled event.`
  },
  {
    id: "indemnification",
    title: "Indemnification",
    content: `The undersigned agrees to defend, indemnify and hold harmless Silverleaf Reserve Homeowners Association, its officers, directors, members, contractors, agents and employees from and against any suit, claim, loss or cause of action arising out of, or in conjunction with the utilization of the facilities, or the areas in proximity to the facilities, by undersigned pursuant to this agreement.

In addition, the undersigned agrees to reimburse Silverleaf Reserve HOA for any and all damages including, but not limited to equipment, fixtures, furniture or other property, either real or personal arising out of the utilization of the facilities, pursuant to this agreement, without regard to whether such damage is caused by the undersigned or is the result of negligence or other fault of the undersigned or the undersigned's guest.

Silverleaf Reserve Homeowners Association, Inc assumes no liability whatsoever to undersigned for any mechanical or electrical failure, natural disaster, riot, act of God or any other development which may prevent, disrupt, limit or frustrate the undersigned's use of the facilities and is not liable for the loss or damage to the undersigned's personal property.`
  },
  {
    id: "declaration",
    title: "Declaration",
    content: `I hereby declare that I am a Resident of Silverleaf Reserve Homeowners Association. I further declare that I enter into this agreement having read and fully understanding its terms and obligation; and that I and my guest(s) agree to abide by all rules, policies, procedures and regulations which govern The Silverleaf Reserve Homeowners Association clubhouse and recreational facilities.`
  },
  {
    id: "application-fields",
    title: "Application Fields",
    content: `Date of Application
All Homeowners are required to be current on dues and compliant with the rules and regulations.
$250.00 Rental Check and a $250 Deposit Check must accompany this application. Please write 2 separate Checks. All Checks must be made out to Silverleaf Reserve Homeowners Association. Inc.

Name:
Phone #:
Address:
Email:
Type of Function:
Number of guests:
Rental Fee Check #
Deposit Check #

(initial here) I have read, signed and fully understand the attached rules and agree to abide by them during the rental period. I understand that I will be responsible for all damages to the clubhouse during the rental period. Silverleaf HOA and HomeRiver Group are not responsible for any articles that may be left behind or thrown away as a result of the renter not removing them when they depart.

Signature
Date
Homeowner Signature (or attach approval email)
Date`
  },
  {
    id: "submission",
    title: "Submission Instructions",
    content: `Note, renters must attach written permission from the owner to this application. Reservations will not be confirmed without the proof of owner's permission in writing.

Please return application and checks to:
folio AM
4301 Vineland Rd. Ste. E-1
Orlando, FL 32811
silverleafreserve@folioam.com`
  }
];
