using System;

using Realms;

namespace InteractDev
{
	public class TeamMember : RealmObject
	{
		public string Identifier 
			{ get; set; }
		public string Name 
			{ get; set; }
		public string Username 
			{ get; set; }
		public bool IsCurrentlyMember
			{ get; set; }

		public TeamMember() {}

		public TeamMember(string id, string name, string username)
		{
			Identifier = id;
			Name = name;
			Username = username;

			IsCurrentlyMember = true;
		}
	}
}
