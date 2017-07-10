using System;
using System.Linq;
using System.Threading.Tasks;

using Realms;

namespace InteractDev
{
	public static class SyncUtils
	{
		public static async Task<bool> UpdateLocalTeamMembers()
		{
			using (var realm = Realm.GetInstance())
			{
				var members = await QuantiServer.GetTeamMembers();
				
				if (members == null)
					return false;

				foreach (var m in members)
				{
					if (m.username == QuantiServer.Username)	//	Don't add self!
						continue;	
					
					var objs = realm.All<TeamMember>().Where(tm => tm.Identifier == m.id);

					if (objs.Count() == 0)
					{
						//	The team member does not exist in the database...

						realm.Write(() =>
						{
							realm.Add(new TeamMember
							{
								Identifier = m.id,
								Name = m.name,
								Username = m.username
							});
						});
					}
					else
					{
						//	The team member exists...

						var fo = objs.First();

						if (fo.Name != m.name)
						{
							//	But has changed their name!

							realm.Write(() =>
							{
								fo.Name = m.name;
							});
						}
					}
				}

				//	Now, disabling all the (old) team members, and re-enabling
				//	everyone who may have come back... (Hey, welcome back!)

				var allSaved = realm.All<TeamMember>();

				foreach (var saved in allSaved)
				{
					bool found = false;

					foreach (var current in members)
					{
						if (current.id == saved.Identifier)
						{
							found = true;

							break;
						}
					}

					realm.Write(() =>
					{
						saved.IsCurrentlyMember = found;
					});
				}

				return true;
			}
		}

		public static async Task<bool> UpdateLocalInteractionNotes()
		{
			var interactions = await QuantiServer.DownloadInteractionNotes();

			if (interactions == null)
				return false;

			using (var realm = Realm.GetInstance())
			{
				foreach (var interaction in interactions)
				{
					var exists = realm.All<InteractionLog>().Where(il => il.RemoteIdentifier == interaction.identifier).Count() != 0;

					if (!exists)
					{
						var members = realm.All<TeamMember>().Where(tm => tm.Identifier == interaction.intervenient.id);

						if (members.Count() == 0)
							continue;	//	Meh. Do not even bother!

						realm.Write(() =>
						{
							realm.Add(new InteractionLog
							{
								RemoteIdentifier = interaction.identifier,
								ElapsedTime = interaction.duration,
								Shared = interaction.shared,
								Rating = interaction.rating,
								Note = interaction.notes,
								Date = interaction.StartDateOffset,
								Member = members.First()
							});
						});
					}
				}
			}

			return true;
		}
	}
}
