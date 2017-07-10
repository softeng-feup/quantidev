using System;

using Realms;

namespace InteractDev
{
	public class InteractionLog : RealmObject
	{
		public string RemoteIdentifier
			{ get; set; }
		public TeamMember Member 
			{ get; set; }
		public int ElapsedTime
			{ get; set; }
		public bool Shared
			{ get; set; }
		public int Rating
			{ get; set; }
		public string Note
			{ get; set; }
		public DateTimeOffset Date
			{ get; set; }

		public string LengthRepresentation
		{
			get
			{
				return Utilities.SecondsToHMS(ElapsedTime);
			}
		}

		public string DateRepresentation
		{
			get
			{
				return Date.ToString("F");
			}
		}

		public string RatingRepresentation
		{
			get
			{
				switch (Rating)
				{
						case 1:
						{
							return "😟";
						}

						case 2:
						{
							return "🙁";
						}

						case 3:
						{
							return "😶";
						}

						case 4:
						{
							return "😀";
						}

						case 5:
						{
							return "😁";
						}
				}

				return null;
			}
		}

		public InteractionLog()
		{
		}
	}
}
